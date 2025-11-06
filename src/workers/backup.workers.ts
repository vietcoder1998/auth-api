import { PrismaClient } from '@prisma/client';
import { BaseWorker } from './base.worker';
import path from 'path';
import {
  BackupJobPayload,
  WorkerJobData,
  WorkerEnvironment,
  WorkerResponse,
} from '../interfaces/worker.interface';
import { prisma } from '../setup';

export class BackupWorker extends BaseWorker<BackupJobPayload> {
  constructor(workerPath?: string) {
    super(workerPath || path.resolve(__dirname, './backup.workers.ts'));
  }


  /**
   * Nhận job từ process.on('message')
   */
  protected override async onMessage(
    job: WorkerJobData<BackupJobPayload>
  ): Promise<void> {
    await this.processJob(job);
  }

  /**
   * Logic xử lý job chính (giữ nguyên logic bạn đang có)
   */
  protected async processJob(job: WorkerJobData<BackupJobPayload>): Promise<void> {
    try {
      console.log('🚀 Starting backup job...');
      await new Promise((resolve) => setTimeout(resolve, 1500));

      await prisma.job.update({
        where: { id: job.payload.jobId },
        data: {
          status: 'completed',
          result: JSON.stringify({
            message: 'Backup job completed',
            payload: job.payload,
          }),
          finishedAt: new Date(),
        },
      });

      const response: WorkerResponse = {
        success: true,
        data: {
          jobId: job.payload.jobId,
          type: job.payload.type,
          result: 'Backup job completed',
          payload: job.payload,
        },
      };

      process.send?.(response);
      console.log(`✅ Backup completed for job ${job.payload.jobId}`);
    } catch (error) {
      await prisma.job.update({
        where: { id: job.payload.jobId },
        data: {
          status: 'failed',
          error: String(error),
          finishedAt: new Date(),
        },
      });

      const response: WorkerResponse = {
        success: false,
        data: {
          jobId: job.payload.jobId,
          type: job.payload.type,
        },
        error: String(error),
      };

      process.send?.(response);
      console.error(`❌ Backup failed for job ${job.payload.jobId}`, error);
    } finally {
      await prisma.$disconnect();
    }
  }
}

export const backupWorker = new BackupWorker('./backup.worker.ts');