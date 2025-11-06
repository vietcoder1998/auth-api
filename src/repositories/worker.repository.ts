import { FineTuningWorker, ExtractWorker, RestoreWorker, BackupWorker } from '../workers';

export class WorkerRepository {
    public readonly restoreWorker = new RestoreWorker();
    public readonly fineTunningWorker = new FineTuningWorker();
    public readonly extractWorker = new ExtractWorker();
    public readonly backupWorker = new BackupWorker();
}