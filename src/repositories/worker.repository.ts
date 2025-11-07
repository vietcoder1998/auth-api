import { BackupWorker, ExtractWorker, FineTuningWorker } from '../workers';
import { Factory, Thread } from './../workers/factory.worker';
import { RestoreWorker } from './../workers/restore.worker';

export class WorkerRepository {
  public readonly factory: Factory;

  public constructor(threadId: string) {
    const thread: Thread = new Thread(threadId, [], []);
    this.factory = new Factory(thread);
  }

}
