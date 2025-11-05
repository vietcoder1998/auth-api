import { RabbitMQRepository } from '../repositories/rabbitmq.repository';
import { JobRepository } from '../repositories/job.repository';
import { JobService } from './job.service';
import { logError, logInfo } from '../middlewares/logger.middle';
import { Worker } from 'worker_threads';
import { v4 as uuidv4 } from 'uuid';

export class WorkerService {
  private readonly rabbitMQRepository: RabbitMQRepository;
  private readonly jobRepository: JobRepository;
  private readonly jobService: JobService;
  private workerId: string;
  private isRunning: boolean = false;

  private readonly JOB_TYPES = [
    'extract',
    'file-tuning',
    'backup',
    'execute_tool',
    'generate_prompt',
    'conversation',
    'document',
    'database',
  ];

  private readonly WORKER_PATHS: Record<string, string> = {
    extract: require.resolve('../workers/extract.workers.ts'),
    backup: require.resolve('../workers/backup.workers.ts'),
    'file-tuning': require.resolve('../workers/fine-tuning.workers.ts'),
    execute_tool: require.resolve('../workers/execute-tool.workers.ts'),
    generate_prompt: require.resolve('../workers/generate-prompt.workers.ts'),
  };

  constructor(
    rabbitMQRepository: RabbitMQRepository,
    jobRepository: JobRepository,
    jobService: JobService
  ) {
    this.rabbitMQRepository = rabbitMQRepository;
    this.jobRepository = jobRepository;
    this.jobService = jobService;
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

              // Create worker thread
              const worker = new Worker(workerPath);
              
              // Send job data to worker
              worker.postMessage({
                jobId: jobData.jobId,
                type: jobData.type,
                payload: jobData.payload,
                workerId: this.workerId,
              });

              // Handle worker messages (results)
              worker.on('message', async (result) => {
                try {
                  await this.jobService.saveJobResultIntoJob({
                    id: jobData.jobId, // or generate a new id if needed
                    jobId: jobData.jobId,
                    status: 'completed',
                    result: result.data,
                    processingTime: result.processingTime || 0,
                    metadata: result.metadata,
                    createdAt: new Date(), // or use result.createdAt if available
                  });
                  
                  logInfo(`Worker finished successfully`, {
                    workerId: this.workerId,
                    jobId: jobData.jobId,
                    type: jobData.type,
                  });

                  worker.terminate();
                } catch (error) {
                  logError('Failed to save worker result', {
                    workerId: this.workerId,
                    jobId: jobData.jobId,
                    error,
                  });
                }
              });

              // Handle worker errors
              worker.on('error', async (error) => {
                try {
                  await this.jobService.saveJobResultIntoJob({
                    id: jobData.jobId,
                    jobId: jobData.jobId,
                    status: 'failed',
                    error: error.message,
                    processingTime: 0,
                    createdAt: new Date(),
                  });
                  
                  logError('Worker error', {
                    workerId: this.workerId,
                    jobId: jobData.jobId,
                    type: jobData.type,
                    error,
                  });

                  worker.terminate();
                } catch (saveError) {
                  logError('Failed to save worker error', {
                    workerId: this.workerId,
                    jobId: jobData.jobId,
                    error: saveError,
                  });
                }
              });

              // Handle worker exit
              worker.on('exit', (code) => {
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
}