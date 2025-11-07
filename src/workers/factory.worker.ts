import path from 'path';
import { Job, JobErrorResult, JobPayload, JobResult, JobSuccessResult } from './job.worker';
import { ThreadWorker } from './thread.worker';

export class Thread {
  private readonly threadId: string;
  public readonly jobList: Job[] = [];
  private jobSuccessList: JobSuccessResult[] = [];
  private jobErrorList: JobErrorResult[] = [];
  private readonly threadWorkers: ThreadWorker[] = [];

  public constructor(threadId: string, jobList: Job[], threadWorkers: ThreadWorker[]) {
    this.threadId = threadId;
    this.jobList = jobList;
    this.threadWorkers = threadWorkers;
  }

  public start(): ThreadWorker[] {
    for (
      let threadWorkerIndex = 0;
      threadWorkerIndex < this.threadWorkers.length;
      threadWorkerIndex++
    ) {
      const threadWorker: ThreadWorker = this.threadWorkers[threadWorkerIndex];

      threadWorker.on('message', (message: string, job: JobSuccessResult) => {
        // Handle messages from the worker
        this.sendJobErrorResult(job);
        this.checkExitStatus();
      });
      threadWorker.on('error', (error) => {
        // Handle errors from the worker
        const jobResult = new JobErrorResult(threadWorker?.job?.jobId || '', {});
        this.sendJobErrorResult(jobResult);
        this.checkExitStatus();
      });
      threadWorker.on('exit', (code) => {
        // Handle worker exit
        threadWorker.inActive();
        this.removeThreadWorker(threadWorker.workerId);
        this.checkExitStatus();
      });
    }

    return this.threadWorkers;
  }
  public cancel(): JobResult[] {
    const results: JobResult[] = [];

    return results;
  }
  public addNewThreadWorker(threadWorker: ThreadWorker): ThreadWorker[] {
    this.threadWorkers.push(threadWorker);

    return this.threadWorkers;
  }
  public addNewJobToWorker<T>(jobPayload: JobPayload): ThreadWorker[] {
    switch (jobPayload.jobType) {
      case 'backup':
        const backupJobPath: string = './jobs/backup.job.ts';
        const workerId: string = String(this.threadWorkers.length);
        const job: Job = new Job(jobPayload.jobId, workerId, this.threadId);
        const threadWorker = new ThreadWorker(path.resolve(__dirname, backupJobPath), {
          workerData: job,
        } as WorkerOptions);

        this.threadWorkers.push(threadWorker);
        break;

      default:
        break;
    }
    return this.start();
  }
  public removeThreadWorker(threadWorkerId: string): ThreadWorker[] {
    const index = this.threadWorkers.findIndex((tw) => tw.workerId === threadWorkerId);

    if (index > -1) {
      this.threadWorkers.splice(index, 1);
    }
    return this.threadWorkers;
  }
  public sendJobErrorResult(result: JobResult): void {
    this.jobErrorList.push(result as JobErrorResult);
  }
  public sendJobSuccessResult(result: JobResult): void {
    this.jobSuccessList.push(result as JobSuccessResult);
  }
  public countActiveWorkers(): number {
    return this.threadWorkers.filter((threadWorker: ThreadWorker) => threadWorker.active).length;
  }
  public removeAllWorker(): ThreadWorker[] {
    this.threadWorkers.splice(0, this.threadWorkers.length);
    return this.threadWorkers;
  }
  public removeAllJobs(): Job[] {
    this.jobList.splice(0, this.jobList.length);
    return this.jobList;
  }
  public close(): void {
    this.removeAllJobs();
    this.removeAllWorker();
  }
  private checkExitStatus(): void {
    if (
      !this.countActiveWorkers() ||
      this.jobList.length === this.jobSuccessList.length + this.jobErrorList.length
    ) {
      return this.close();
    }
  }
}

export class Factory {
  private readonly thread: Thread;

  public constructor(thread: Thread) {
    this.thread = thread;
  }
}
