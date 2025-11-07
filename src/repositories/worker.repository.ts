import { BackupWorker, ExtractWorker, FineTuningWorker } from '../workers';
import { RestoreWorker } from './../workers/restore.worker';

export class WorkerRepository {
  public readonly restoreWorker = new RestoreWorker();
  public readonly fineTunningWorker = new FineTuningWorker();
  public readonly extractWorker = new ExtractWorker();
  public readonly backupWorker = new BackupWorker();

  public constructor() {}
  public getWorkerByJobType(
    type: string,
  ): RestoreWorker | FineTuningWorker | ExtractWorker | BackupWorker {
    switch (type) {
      case 'extract':
        return this.extractWorker;
      case 'file-tuning':
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
