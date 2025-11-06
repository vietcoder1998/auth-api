import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { BaseWorker } from './base.worker';
import { 
  ExtractJobPayload, 
  WorkerJobData, 
  WorkerEnvironment,
  WorkerResponse 
} from '../interfaces/worker.interface';

const prisma = new PrismaClient();

export class BackupWorker extends BaseWorker<ExtractJobPayload> {
  constructor() {
    // Truyền đường dẫn thật của file worker logic
    super(path.resolve(__dirname, './backup.workers.ts'));
  }

  /**
   * Ghi đè onMessage để xử lý job từ service
   */
  protected override async onMessage(job: WorkerJobData<ExtractJobPayload>): Promise<void> {
    console.log('🧩 BackupWorker received job:', job);
    await this.processJob(job);
  }

  /**
   * Nếu worker được chạy trực tiếp (ví dụ spawn bằng fork --env), 
   * đọc từ biến môi trường và xử lý luôn
   */
  public async runFromEnv(): Promise<void> {
    const env: WorkerEnvironment = {
      jobId: process.env.JOB_ID,
      jobType: process.env.JOB_TYPE,
      jobPayload: process.env.JOB_PAYLOAD,
      workerId: process.env.WORKER_ID,
      userId: process.env.USER_ID
    };

    if (env.jobId && env.jobType) {
      const payload: ExtractJobPayload = env.jobPayload
        ? JSON.parse(env.jobPayload)
        : {
            jobId: env.jobId,
            type: env.jobType,
            workerId: env.workerId,
            userId: env.userId,
          };

      await this.processJob({ jobId: env.jobId, type: env.jobType, payload });
    }
  }

  /**
   * 🧠 Logic chính: backup toàn bộ database
   */
  protected override async processJob(job: WorkerJobData<ExtractJobPayload>) {
    try {
      console.log(`🚀 Starting backup for job ${job.payload.jobId}`);

      // Lấy danh sách table
      const tables = await prisma.$queryRawUnsafe<any[]>(`SHOW TABLES`);
      const dbBackup: Record<string, any[]> = {};

      for (const tableObj of tables) {
        const tableName = String(Object.values(tableObj)[0]);
        const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM \`${tableName}\``);
        dbBackup[tableName] = rows;
      }

      // Ghi file backup
      const backupDir = path.resolve(__dirname, '../../backups');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
      const backupFile = path.join(backupDir, `db-backup-${job.payload.jobId}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(dbBackup, null, 2), 'utf8');

      // Cập nhật trạng thái job
      await prisma.job.update({
        where: { id: job.payload.jobId },
        data: {
          status: 'completed',
          result: JSON.stringify({ message: 'DB backup completed', backupFile }),
          finishedAt: new Date(),
        },
      });

      const response: WorkerResponse = {
        success: true,
        data: {
          jobId: job.payload.jobId,
          type: job.payload.type,
          result: 'DB backup completed',
          details: { backupFile },
          payload: job.payload,
        },
      };

      process.send?.(response);
      console.log(`✅ Backup completed: ${backupFile}`);
    } catch (error: any) {
      await prisma.job.update({
        where: { id: job.payload.jobId },
        data: {
          status: 'failed',
          error: String(error?.message || error),
          finishedAt: new Date(),
        },
      });

      const response: WorkerResponse = {
        success: false,
        data: { 
          jobId: job.payload.jobId,
          type: job.payload.type 
        },
        error: String(error?.message || error),
      };

      process.send?.(response);
      console.error('❌ Backup failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }
}
