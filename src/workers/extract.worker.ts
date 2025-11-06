import {
  ExtractJobPayload
} from '../interfaces/worker.interface';
import { BaseWorker } from './base.worker';

export class ExtractWorker extends BaseWorker<ExtractJobPayload> {
  public static readonly instance = new ExtractWorker();
  public constructor() {
    super(__filename);
  }
}
