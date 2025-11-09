import { BaseWorker } from './base.worker';
import { Job } from './job.worker';

interface BackupResult {}

export class ThreadWorker extends BaseWorker<BackupResult> {
  private _active: number = 1;
  private _position: string = 'cpu';
  private _job: Job | null = null;

  public set job(value: Job | null) {
    this._job = value;
  }

  public get job(): Job | null {
    return this._job;
  }

  constructor(filename: string, options?: WorkerOptions) {
    super(filename, options);
  }
  public get active(): boolean {
    return this._active > 0;
  }
  public inActive(): boolean {
    this._active = 0;

    return this._active <= 0;
  }
  public get position() {
    return this._position;
  }

  public set position(pos: string) {
    this._position = pos;
  }
}
