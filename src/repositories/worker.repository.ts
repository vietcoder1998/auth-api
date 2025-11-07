import { BackupWorker, ExtractWorker, FineTuningWorker } from '../workers';
import { Factory, Thread } from './../workers/factory.worker';
import { RestoreWorker } from './../workers/restore.worker';

export class WorkerRepository {
  public readonly restoreWorker = new RestoreWorker('../workers/restore.worker.ts');
  public readonly fineTunningWorker = new FineTuningWorker('../workers/fine-tuning.worker.ts');
  public readonly extractWorker = new ExtractWorker('../workers/extract.worker.ts');
  public readonly backupWorker = new BackupWorker('../workers/backup.worker.ts');
  public readonly factory: Factory;

  public constructor(threadId: string) {
    const thread: Thread = new Thread(threadId, [], []);
    this.factory = new Factory(thread);
  }

  public getWorkerByJobType(
    type: string,
  ): RestoreWorker | FineTuningWorker | ExtractWorker | BackupWorker {
    switch (type) {
      case 'extract':
        return this.extractWorker;
      case 'fine-tuning':
        return this.fineTunningWorker;
      case 'backup':
        return this.backupWorker;
      case 'restore':
        return this.restoreWorker;
      default:
        throw new Error(`No worker found for job type: ${type}`);
    }
  }
}
