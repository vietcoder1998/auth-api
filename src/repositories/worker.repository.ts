import { Thread } from './../workers/factory.worker';
import { JobPayload } from './../workers/job.worker';

export class WorkerRepository {
  private readonly thread: Thread;
  public constructor(threadId: string) {
    this.thread = new Thread(threadId, [], []);
  }

  public startNewThread(jobThreadPayload: JobPayload) {
    return this.thread.addNewJobToWorker(jobThreadPayload);
  }
}
