import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { 
  RestoreJobPayload, 
  WorkerJobData, 
  WorkerEnvironment,
  WorkerResponse 
} from '../interfaces/worker.interface';
import { BaseWorker } from './base.worker';
import { prisma } from '../setup';


class RestoreWorker extends BaseWorker<RestoreJobPayload> {
  constructor() {
    super(__filename);
  }

  protected async handleJob(job: WorkerJobData<RestoreJobPayload>): Promise<void> {
    await this.processJob(job);
  }

  async processJob(job: WorkerJobData<RestoreJobPayload>) {
    try {
      console.log('Starting restore job...', { jobId: job.payload.jobId, url: job.payload.backupUrl });
      
      if (!job.payload.backupUrl) throw new Error('Backup URL is required');

      const tempFilePath = await this.downloadBackupFile(job.payload.backupUrl, job.payload.jobId);

      if (job.payload.options?.validate !== false)
        await this.validateBackupFile(tempFilePath);

      const result = await this.restoreToDatabase(tempFilePath, job.payload);
      await this.cleanupTempFile(tempFilePath);

      await prisma.job.update({
        where: { id: job.payload.jobId },
        data: {
          status: 'completed',
          result: JSON.stringify({
            message: 'Restore job completed successfully',
            restoredRecords: result.recordsProcessed,
            tablesRestored: result.tablesRestored,
            duration: result.duration,
            payload: job.payload
          }),
          finishedAt: new Date(),
        },
      });

      const response: WorkerResponse = {
        success: true,
        data: {
          jobId: job.payload.jobId,
          type: job.payload.type,
          result: 'Restore completed successfully',
          details: result,
          payload: job.payload
        }
      };
      process.send?.(response);

    } catch (error) {
      console.error('Restore job failed:', error);

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
        data: { jobId: job.payload.jobId, type: job.payload.type },
        error: String(error)
      };
      process.send?.(response);
    } finally {
      await prisma.$disconnect();
      process.exit(0);
    }
  }

  private async downloadBackupFile(url: string, jobId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const tempDir = path.join(process.cwd(), 'temp', 'restores');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const tempFileName = `restore_${jobId}_${Date.now()}.sql`;
      const tempFilePath = path.join(tempDir, tempFileName);
      const file = fs.createWriteStream(tempFilePath);
      const protocol = url.startsWith('https') ? https : http;

      console.log('Downloading backup from:', url);
      const request = protocol.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download backup file: HTTP ${response.statusCode}`));
          return;
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log('Backup file downloaded successfully:', tempFilePath);
          resolve(tempFilePath);
        });
      });

      request.on('error', (err) => {
        fs.unlink(tempFilePath, () => {});
        reject(new Error(`Download failed: ${err.message}`));
      });

      file.on('error', (err) => {
        fs.unlink(tempFilePath, () => {});
        reject(new Error(`File write failed: ${err.message}`));
      });

      request.setTimeout(300000, () => {
        request.destroy();
        reject(new Error('Download timeout'));
      });
    });
  }

  private async validateBackupFile(filePath: string): Promise<void> {
    if (!fs.existsSync(filePath)) throw new Error('Backup file not found');
    const stats = fs.statSync(filePath);
    if (stats.size === 0) throw new Error('Backup file is empty');

    const content = fs.readFileSync(filePath, { encoding: 'utf8' });
    if (!content.includes('INSERT') && !content.includes('CREATE') && !content.includes('UPDATE'))
      throw new Error('Invalid backup file format');

    console.log('Backup file validation passed');
  }

  private async restoreToDatabase(filePath: string, payload: RestoreJobPayload) {
    const startTime = Date.now();
    let recordsProcessed = 0;
    const tablesRestored: string[] = [];

    console.log('Reading backup file for restoration...');
    const content = fs.readFileSync(filePath, 'utf8');
    const sqlStatements = content
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    const batchSize = payload.options?.batchSize || 100;

    for (let i = 0; i < sqlStatements.length; i += batchSize) {
      const batch = sqlStatements.slice(i, i + batchSize);
      for (const statement of batch) {
        try {
          await prisma.$executeRawUnsafe(statement);
          recordsProcessed++;
          const match = statement.match(/(?:INSERT INTO|UPDATE)\s+`?(\w+)`?/i);
          if (match && !tablesRestored.includes(match[1])) tablesRestored.push(match[1]);
        } catch (error) {
          console.warn(`Failed statement: ${statement.substring(0, 100)}...`, error);
          if (String(error).includes('syntax error')) throw error;
        }
      }
      console.log(`Processed batch ${Math.ceil((i + batchSize) / batchSize)} of ${Math.ceil(sqlStatements.length / batchSize)}`);
    }

    const duration = `${Date.now() - startTime}ms`;
    return { recordsProcessed, tablesRestored, duration };
  }

  private async cleanupTempFile(filePath: string) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Temporary backup file cleaned up:', filePath);
    }
  }
}

export const restoreWorker = new RestoreWorker();