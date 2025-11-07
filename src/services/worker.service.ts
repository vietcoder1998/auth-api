// import { BaseWorker } from './../workers/base.worker';
// import { ChildProcess } from 'child_process';
// import { v4 as uuidv4 } from 'uuid';
// import { logError, logInfo } from '../middlewares/logger.middle';
// import { JobResultRepository } from '../repositories/job-result.repository';
// import { JobRepository } from '../repositories/job.repository';
// import { RabbitMQRepository } from '../repositories/rabbitmq.repository';
// import { WorkerRepository } from '../repositories/worker.repository';

// export class WorkerService {
//   public readonly workerId: string = uuidv4();

//   private readonly rabbitMQRepository = new RabbitMQRepository();
//   private readonly jobRepository = new JobRepository();
//   private readonly jobResultRepository = new JobResultRepository();
//   private readonly workerRepository = new WorkerRepository();
//   public static readonly workerService = new WorkerService();

//   private isRunning = false;
//   private runningWorkers: Map<string, ChildProcess> = new Map();

//   // 🧠 Define job types dynamically (if needed)
//   private readonly JOB_TYPES = [
//     'extract',
//     'file-tuning',
//     'backup',
//     'restore',
//     'execute_tool',
//     'generate_prompt',
//     'conversation',
//     'document',
//     'database',
//   ];

//   /**
//    * Process jobs from message queue
//    */
//   public async processJobs(): Promise<void> {
//     try {
//       if (this.isRunning) {
//         logInfo('Worker service already running', { workerId: this.workerId });
//         return;
//       }

//       this.isRunning = true;
//       const queueNames = [...new Set(this.JOB_TYPES.map((type) => this.getQueueNameForType(type)))];

//       for (const queueName of queueNames) {
//         await this.rabbitMQRepository.consume(queueName, async (msg) => {
//           if (!msg) return;

//           try {
//             const jobData = JSON.parse(msg.content.toString());
//             const { jobId, type, payload } = jobData;

//             logInfo('Processing job from queue', {
//               workerId: this.workerId,
//               jobId,
//               type,
//               queue: queueName,
//             });

//             await this.jobRepository.markStarted(jobId, this.workerId);

//             // 🧩 Get the correct worker instance from the repository
//             const workerInstance: BaseWorker<any> = this.workerRepository.getWorkerByJobType(type);
//             if (!workerInstance) {
//               throw new Error(`No worker found for job type: ${type}`);
//             }

//             // 🧠 Fork the worker process using its built-in method
//             const worker = BaseWorker.start(workerInstance);

//             // Track running worker
//             this.runningWorkers.set(jobId, worker);

//             // Send job data (optional)
//             worker.send({ jobId, type, payload, workerId: this.workerId });

//             // Centralized worker event handling
//             this.handleWorkerEvents(worker, jobId, type);

//             // Acknowledge MQ message
//             await this.rabbitMQRepository.ack(msg);
//           } catch (error) {
//             logError('Error processing job message', { workerId: this.workerId, error });
//             await this.rabbitMQRepository.nack(msg, false, false);
//           }
//         });
//       }

//       logInfo('Worker service started, listening to all queues', {
//         workerId: this.workerId,
//         queues: queueNames,
//       });
//     } catch (error) {
//       this.isRunning = false;
//       logError('Failed to start worker service', { workerId: this.workerId, error });
//       throw error;
//     }
//   }

//   /**
//    * Handle messages and errors from a worker process
//    */
//   private handleWorkerEvents(worker: ChildProcess, jobId: string, jobType: string) {
//     worker.on('message', async (result: any) => {
//       try {
//         await this.jobResultRepository.create({
//           jobId,
//           status: 'completed',
//           result: result.data || result,
//           processingTime: result.processingTime || 0,
//           metadata: result.metadata || {},
//         });

//         await this.jobRepository.update(jobId, {
//           status: 'completed',
//           result: result.data || result,
//           progress: 100,
//           finishedAt: new Date(),
//         });

//         logInfo(`Worker finished successfully`, {
//           workerId: this.workerId,
//           jobId,
//           type: jobType,
//         });

//         this.runningWorkers.delete(jobId);
//         worker.kill();
//       } catch (error) {
//         logError('Failed to save worker result', { workerId: this.workerId, jobId, error });
//       }
//     });

//     worker.on('error', async (error: any) => {
//       try {
//         await this.jobResultRepository.create({
//           jobId,
//           status: 'failed',
//           error: error.message,
//           processingTime: 0,
//         });

//         await this.jobRepository.update(jobId, {
//           status: 'failed',
//           error: error.message,
//           finishedAt: new Date(),
//         });

//         logError('Worker error', { workerId: this.workerId, jobId, jobType, error });
//         this.runningWorkers.delete(jobId);
//         worker.kill();
//       } catch (saveError) {
//         logError('Failed to save worker error', {
//           workerId: this.workerId,
//           jobId,
//           error: saveError,
//         });
//       }
//     });

//     worker.on('exit', (code: number) => {
//       this.runningWorkers.delete(jobId);
//       if (code !== 0) {
//         logError('Worker stopped with exit code', {
//           workerId: this.workerId,
//           jobId,
//           exitCode: code,
//         });
//       }
//     });
//   }

//   /**
//    * Get queue name based on job type
//    */
//   private getQueueNameForType(type: string): string {
//     const queueMap: Record<string, string> = {
//       execute_tool: 'execute_tool',
//       generate_prompt: 'generate_prompt',
//       backup: 'backup',
//       extract: 'extract',
//       'file-tuning': 'file-tuning',
//       restore: 'restore',
//     };
//     return queueMap[type] || 'job-queue';
//   }

//   /**
//    * Start worker service
//    */
//   public async start(): Promise<void> {
//     if (this.isRunning) {
//       logInfo('Worker service already running', { workerId: this.workerId });
//       return;
//     }
//     await this.rabbitMQRepository.connect();
//     await this.processJobs();
//     logInfo('Worker service started successfully', { workerId: this.workerId });
//   }

//   /**
//    * Stop all workers
//    */
//   public async stopAllWorkers(): Promise<void> {
//     const jobIds = Array.from(this.runningWorkers.keys());
//     await Promise.all(jobIds.map((jobId) => this.stopJobWorker(jobId)));
//     logInfo('All workers stopped', { workerId: this.workerId });
//   }

//   /**
//    * Stop a specific worker for a job
//    */
//   public async stopJobWorker(jobId: string): Promise<void> {
//     const worker = this.runningWorkers.get(jobId);
//     if (!worker) return;
//     worker.kill();
//     this.runningWorkers.delete(jobId);
//     await this.jobRepository.update(jobId, {
//       status: 'cancelled',
//       finishedAt: new Date(),
//     });
//     logInfo('Job worker stopped', { workerId: this.workerId, jobId });
//   }
// }
