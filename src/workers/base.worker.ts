import { Worker } from 'worker_threads';
import { WorkerEnvironment, WorkerJobData } from '../interfaces';

export class BaseWorker<T> extends Worker {
  public readonly workerId: string = '';
  public readonly index: number = 0;
  public constructor(filename: string | URL, options?: WorkerOptions) {
    super(filename, options);
    this.start();
  }

  public async runFromEnv(): Promise<void> {
    const env: WorkerEnvironment = {
      jobId: process.env.JOB_ID,
      jobType: process.env.JOB_TYPE,
      jobPayload: process.env.JOB_PAYLOAD,
      workerId: process.env.WORKER_ID,
      userId: process.env.USER_ID,
    };

    if (env.jobId && env.jobType) {
      const payload: WorkerJobData<T> = env.jobPayload
        ? JSON.parse(env.jobPayload)
        : {
            jobId: env.jobId,
            type: env.jobType,
            workerId: env.workerId,
            userId: env.userId,
          };
      await this.processJob(payload);
    }
  }

  private start(): void {
    // base event listener
    // this.on('message', this.onMessage.bind(this));
    // this.on('exit', this.onExit.bind(this));
    // this.on('error', this.onError.bind(this));
  }

  protected async processJob(job: WorkerJobData<T>): Promise<void> {
    return; 
  }

  protected async onJobError(jobId: string, error: Error): Promise<void> {
    return;
  }
}
