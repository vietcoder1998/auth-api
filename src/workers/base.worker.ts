import { ChildProcess, fork } from 'child_process';
import path from 'path';
import { WorkerEnvironment, WorkerJobData, WorkerResponse } from '../interfaces';
import { prisma } from '../setup';

export class BaseWorker<T> {
  public readonly workerPath: string;
  private workerProcess: ChildProcess | null = null;

  constructor(workerPath: string) {
    // đảm bảo path là tuyệt đối
    this.workerPath = path.isAbsolute(workerPath)
      ? workerPath
      : path.resolve(__dirname, workerPath);
  }

  /**
   * Nếu worker được spawn với ENV, chạy luôn.
   */
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

  /**
   * 🔌 Khởi chạy worker trong terminal mới
   */
  public start(): void {
    if (this.workerProcess) {
      console.warn('⚠️ Worker đã được khởi động rồi.');
      return;
    }

    // fork tiến trình mới
    this.workerProcess = fork(this.workerPath, [], {
      stdio: 'inherit', // cho phép in ra terminal
    });

    console.log(`🚀 Worker started: ${this.workerPath} (PID: ${this.workerProcess.pid})`);

    // base event listener
    this.workerProcess.on('message', this.onMessage.bind(this));
    this.workerProcess.on('exit', this.onExit.bind(this));
    this.workerProcess.on('error', this.onError.bind(this));
  }

  /**
   * 📩 Gửi message sang worker
   */
  public send(message: any): void {
    this.workerProcess?.send?.(message);
  }

  /**
   * 🧠 Base handler — override khi kế thừa
   */
  protected onMessage(message: any, data: WorkerJobData<T>): void {
    console.log('📨 Message from worker:', message);

    this.processJob(data);
  }

  protected onExit(code: number | null): void {
    console.log(`💤 Worker exited with code ${code}`);
    this.workerProcess = null;
  }

  protected onError(error: Error): void {
    console.error('❌ Worker error:', error);
  }

  protected async updateJobStatus(
    jobId: string,
    status: string,
    data: Partial<{ result: any; error: string }>,
  ) {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status,
        result: data.result ? JSON.stringify(data.result) : undefined,
        error: data.error,
        finishedAt: new Date(),
      },
    });
  }

  protected sendResponse(response: WorkerResponse) {
    process.send?.(response);
  }

  protected async processJob(job: WorkerJobData<T>): Promise<void> {
    return;
  }
}
