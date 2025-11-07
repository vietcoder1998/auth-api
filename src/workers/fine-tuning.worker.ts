import { FineTuningJobPayload } from '../interfaces/worker.interface';
import { BaseWorker } from './base.worker';

export class FineTuningWorker extends BaseWorker<FineTuningJobPayload> {}
