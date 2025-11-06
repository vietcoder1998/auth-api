import { rabbitMqRepository, RabbitMQRepository } from '../repositories/rabbitmq.repository';
import { JobRepository } from '../repositories/job.repository';
import { JobResultRepository } from '../repositories/job-result.repository';
import { logError, logInfo } from '../middlewares/logger.middle';
import { fork, ChildProcess } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

export class WorkerService {
  private readonly rabbitMQRepository: RabbitMQRepository;
  private readonly jobRepository: JobRepository;
  private readonly jobResultRepository: JobResultRepository;
  private workerId: string;
  private isRunning: boolean = false;
  private runningWorkers: Map<string, ChildProcess> = new Map(); // Track running workers by jobId

  private readonly JOB_TYPES = [
    'extract',
    'file-tuning', 
    'backup',
    'restore',
    'execute_tool',
    'generate_prompt',
    'conversation',
    'document',
    'database',
  ];

  private readonly WORKER_PATHS: Record<string, string> = {
    extract: require.resolve('../workers/extract.workers'),
    backup: require.resolve('../workers/backup.workers'),
    'file-tuning': require.resolve('../workers/fine-tuning.workers'),
    restore: require.resolve('../workers/restore.workers'),
  };

  constructor(
    rabbitMQRepository: RabbitMQRepository,
    jobRepository: JobRepository,
    jobResultRepository: JobResultRepository,
  ) {
    this.rabbitMQRepository = rabbitMQRepository;
    this.jobRepository = jobRepository;
    this.jobResultRepository = jobResultRepository;
    this.workerId = uuidv4();
  }

  /**
   * Process jobs from message queue
   */
  public async processJobs(): Promise<void> {
    try {
      if (this.isRunning) {
        logInfo('Worker service already running', { workerId: this.workerId });
        return;
      }

      this.isRunning = true;

      // Get all unique queue names
      const queueNames = [...new Set(Object.keys(this.WORKER_PATHS).map((type) =>
        this.getQueueNameForType(type)
      ))];

      // Process each queue
      for (const queueName of queueNames) {
        await this.rabbitMQRepository.consume(
          queueName,
          async (msg) => {
            if (!msg) return;

            try {
              const jobData = JSON.parse(msg.content.toString());
              
              logInfo('Processing job from queue', {
                workerId: this.workerId,
                jobId: jobData.jobId,
                type: jobData.type,
                queue: queueName,
              });

              // Update job status to processing
              await this.jobRepository.markStarted(jobData.jobId, this.workerId);

              // Get worker path for job type
              let workerPath = this.WORKER_PATHS[jobData.type];
              if (!workerPath) {
                workerPath = require.resolve('../workers/generic.job.worker.ts');
                logInfo('Using generic worker', { jobType: jobData.type });
              }

              // Create worker process
              const worker = fork(workerPath, [], {
                env: {
                  ...process.env,
                  JOB_ID: jobData.jobId,
                  JOB_TYPE: jobData.type,
                  JOB_PAYLOAD: JSON.stringify(jobData.payload),
                  WORKER_ID: this.workerId,

                }
              });
              
              // Track the worker
              this.runningWorkers.set(jobData.jobId, worker);
              
              // Send job data to worker (optional, already in env)
              worker.send({
                jobId: jobData.jobId,
                type: jobData.type,
                payload: jobData.payload,
                workerId: this.workerId,
              });

              // Handle worker messages (results)
              worker.on('message', async (result: any) => {
                try {
                  // Create job result using repository
                  await this.jobResultRepository.create({
                    jobId: jobData.jobId,
                    status: 'completed',
                    result: result.data || result,
                    processingTime: result.processingTime || 0,
                    metadata: result.metadata || {},
                  });

                  // Update job status
                  await this.jobRepository.update(jobData.jobId, {
                    status: 'completed',
                    result: result.data || result,
                    progress: 100,
                    finishedAt: new Date(),
                  });
                  
                  logInfo(`Worker finished successfully`, {
                    workerId: this.workerId,
                    jobId: jobData.jobId,
                    type: jobData.type,
                  });

                  // Clean up
                  this.runningWorkers.delete(jobData.jobId);
                  worker.kill();
                } catch (error) {
                  logError('Failed to save worker result', {
                    workerId: this.workerId,
                    jobId: jobData.jobId,
                    error,
                  });
                }
              });

              // Handle worker errors
              worker.on('error', async (error: any) => {
                try {
                  // Create job result for failure
                  await this.jobResultRepository.create({
                    jobId: jobData.jobId,
                    status: 'failed',
                    error: error.message,
                    processingTime: 0,
                  });

                  // Update job status to failed
                  await this.jobRepository.update(jobData.jobId, {
                    status: 'failed',
                    error: error.message,
                    finishedAt: new Date(),
                  });
                  
                  logError('Worker failed', {
                    workerId: this.workerId,
                    jobId: jobData.jobId,
                    type: jobData.type,
                    error,
                  });

                  // Clean up
                  this.runningWorkers.delete(jobData.jobId);
                  worker.kill();
                } catch (saveError) {
                  logError('Failed to save worker error', {
                    workerId: this.workerId,
                    jobId: jobData.jobId,
                    error: saveError,
                  });
                }
              });

              // Handle worker exit
              worker.on('exit', (code: any) => {
                this.runningWorkers.delete(jobData.jobId);
                if (code !== 0) {
                  logError('Worker stopped with exit code', {
                    workerId: this.workerId,
                    jobId: jobData.jobId,
                    exitCode: code,
                  });
                }
              });

              // Acknowledge message
              await this.rabbitMQRepository.ack(msg);
            } catch (error) {
              logError('Error processing job message', {
                workerId: this.workerId,
                error,
              });
              // Reject and don't requeue if there's a parsing error
              await this.rabbitMQRepository.nack(msg, false, false);
            }
          }
        );
      }

      logInfo('Worker service started, listening to all queues', {
        workerId: this.workerId,
        queues: queueNames,
      });
    } catch (error) {
      this.isRunning = false;
      logError('Failed to start worker service', {
        workerId: this.workerId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get queue name based on job type
   */
  private getQueueNameForType(type: string): string {
    const queueMap: Record<string, string> = {
      execute_tool: 'execute_tool',
      generate_prompt: 'generate_prompt',
      backup: 'backup',
      extract: 'extract',
      'file-tuning': 'file-tuning',
    };
    return queueMap[type] || 'job-queue';
  }

  /**
   * Start the worker service
   */
  public async start(): Promise<void> {
    try {
      if (this.isRunning) {
        logInfo('Worker service already running', { workerId: this.workerId });
        return;
      }

      await this.rabbitMQRepository.connect();
      await this.processJobs();
      
      logInfo('Worker service started successfully', { workerId: this.workerId });
    } catch (error) {
      logError('Failed to start worker service', { workerId: this.workerId, error });
      throw error;
    }
  }

  /**
   * Stop the worker service
   */
  public async stop(): Promise<void> {
    try {
      this.isRunning = false;
      
      // Stop all running workers
      await this.stopAllWorkers();
      
      await this.rabbitMQRepository.disconnect();
      logInfo('Worker service stopped', { workerId: this.workerId });
    } catch (error) {
      logError('Error stopping worker service', { workerId: this.workerId, error });
      throw error;
    }
  }

  /**
   * Get worker ID
   */
  public getWorkerId(): string {
    return this.workerId;
  }

  /**
   * Check if worker is running
   */
  public isWorkerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Start a specific worker for a job
   */
  public async startJobWorker(jobId: string, jobType: string, payload: any): Promise<void> {
    try {
      // Stop existing worker if any
      await this.stopJobWorker(jobId);

      // Update job status to processing
      await this.jobRepository.update(jobId, {
        status: 'running',
        startedAt: new Date(),
      });

      // Get worker path for job type
      let workerPath = this.WORKER_PATHS[jobType];
      if (!workerPath) {
        workerPath = require.resolve('../workers/generic.job.worker.ts');
        logInfo('Using generic worker', { jobType });
      }

      // Create worker process
      const worker = fork(workerPath, [], {
        env: {
          ...process.env,
          JOB_ID: jobId,
          JOB_TYPE: jobType,
          JOB_PAYLOAD: JSON.stringify(payload),
          WORKER_ID: this.workerId,
        }
      });
      
      // Track the worker
      this.runningWorkers.set(jobId, worker);
      
      // Send job data to worker
      worker.send({
        jobId,
        type: jobType,
        payload: typeof payload === 'string' ? JSON.parse(payload) : payload,
        workerId: this.workerId,
      });

      // Handle worker messages (results)
      worker.on('message', async (result: any) => {
        try {
          // Create job result using repository
          await this.jobResultRepository.create({
            jobId,
            status: 'completed',
            result: result.data || result,
            processingTime: result.processingTime || 0,
            metadata: result.metadata || {},
          });

          // Update job status
          await this.jobRepository.update(jobId, {
            status: 'completed',
            result: result.data || result,
            progress: 100,
            finishedAt: new Date(),
          });
          
          logInfo(`Worker finished successfully`, {
            workerId: this.workerId,
            jobId,
            type: jobType,
          });

          // Clean up
          this.runningWorkers.delete(jobId);
          worker.kill();
        } catch (error) {
          logError('Failed to save worker result', {
            workerId: this.workerId,
            jobId,
            error,
          });
        }
      });

      // Handle worker errors
      worker.on('error', async (error: any) => {
        try {
          // Create job result for failure
          await this.jobResultRepository.create({
            jobId,
            status: 'failed',
            error: error.message,
            processingTime: 0,
          });

          // Update job status to failed
          await this.jobRepository.update(jobId, {
            status: 'failed',
            error: error.message,
            finishedAt: new Date(),
          });
          
          logError('Worker error', {
            workerId: this.workerId,
            jobId,
            type: jobType,
            error,
          });

          // Clean up
          this.runningWorkers.delete(jobId);
          worker.kill();
        } catch (saveError) {
          logError('Failed to save worker error', {
            workerId: this.workerId,
            jobId,
            error: saveError,
          });
        }
      });

      // Handle worker exit
      worker.on('exit', (code: any) => {
        this.runningWorkers.delete(jobId);
        if (code !== 0) {
          logError('Worker stopped with exit code', {
            workerId: this.workerId,
            jobId,
            exitCode: code,
          });
        }
      });

      logInfo('Job worker started', {
        workerId: this.workerId,
        jobId,
        type: jobType,
      });
    } catch (error) {
      logError('Failed to start job worker', {
        workerId: this.workerId,
        jobId,
        error,
      });
      throw error;
    }
  }

  /**
   * Stop a specific worker for a job
   */
  public async stopJobWorker(jobId: string): Promise<void> {
    try {
      const worker = this.runningWorkers.get(jobId);
      if (worker) {
        worker.kill();
        this.runningWorkers.delete(jobId);
        
        // Update job status to cancelled
        await this.jobRepository.update(jobId, {
          status: 'cancelled',
          finishedAt: new Date(),
        });

        logInfo('Job worker stopped', {
          workerId: this.workerId,
          jobId,
        });
      }
    } catch (error) {
      logError('Failed to stop job worker', {
        workerId: this.workerId,
        jobId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get all running job IDs
   */
  public getRunningJobIds(): string[] {
    return Array.from(this.runningWorkers.keys());
  }

  /**
   * Stop all running workers
   */
  public async stopAllWorkers(): Promise<void> {
    try {
      const jobIds = this.getRunningJobIds();
      await Promise.all(jobIds.map(jobId => this.stopJobWorker(jobId)));
      logInfo('All workers stopped', { workerId: this.workerId });
    } catch (error) {
      logError('Failed to stop all workers', { workerId: this.workerId, error });
      throw error;
    }
  }
}

export const workerService = new WorkerService(
  new RabbitMQRepository(),
  new JobRepository(),
  new JobResultRepository(),
);