import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { BaseWorker } from './base.worker';
import { 
  RestoreJobPayload, 
  WorkerJobData, 
  WorkerResponse 
} from '../interfaces/worker.interface';
import { prisma } from '../setup';

export class RestoreWorker extends BaseWorker<RestoreJobPayload> {
  protected async processJob(job: WorkerJobData<RestoreJobPayload>): Promise<void> {
    try {
      console.log('Starting restore job...', { jobId: job.payload.jobId, url: job.payload.backupUrl });

      // Validate payload
      if (!job.payload.backupUrl) {
        throw new Error('Backup URL is required');
      }

      // 1️⃣ Download backup file
      const tempFilePath = await this.downloadBackupFile(job.payload.backupUrl, job.payload.jobId);

      // 2️⃣ Validate file (optional)
      if (job.payload.options?.validate !== false) {
        await this.validateBackupFile(tempFilePath);
      }

      // 3️⃣ Restore data to database
      const result = await this.restoreToDatabase(tempFilePath, job.payload);

      // 4️⃣ Clean up temporary file
      await this.cleanupTempFile(tempFilePath);

      // ✅ Update job status in DB
      await this.updateJobStatus(job.payload.jobId, 'completed', {
        result: {
          message: 'Restore job completed successfully',
          restoredRecords: result.recordsProcessed,
          tablesRestored: result.tablesRestored,
          duration: result.duration,
          payload: job.payload
        },
      });

      // ✅ Send success response
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
      this.sendResponse(response);

    } catch (error: any) {
      console.error('Restore job failed:', error);

      // ❌ Update job status
      await this.updateJobStatus(job.payload.jobId, 'failed', { error: String(error) });

      // ❌ Send failure response
      const response: WorkerResponse = {
        success: false,
        data: { jobId: job.payload.jobId, type: job.payload.type },
        error: String(error)
      };
      this.sendResponse(response);
    } finally {
      await prisma.$disconnect();
      process.exit(0);
    }
  }

  // --- Helper methods below --- //

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

      request.on('error', (error) => {
        fs.unlink(tempFilePath, () => {});
        reject(new Error(`Download failed: ${error.message}`));
      });

      file.on('error', (error) => {
        fs.unlink(tempFilePath, () => {});
        reject(new Error(`File write failed: ${error.message}`));
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

    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(1024);
    const bytesRead = fs.readSync(fd, buffer, 0, 1024, 0);
    fs.closeSync(fd);

    const content = buffer.toString('utf8', 0, bytesRead);
    if (!content.match(/(INSERT|CREATE|UPDATE)/)) {
      throw new Error('Invalid backup file format');
    }

    console.log('Backup file validation passed');
  }

  private async restoreToDatabase(filePath: string, payload: RestoreJobPayload): Promise<{
    recordsProcessed: number;
    tablesRestored: string[];
    duration: string;
  }> {
    const startTime = Date.now();
    let recordsProcessed = 0;
    const tablesRestored: string[] = [];

    console.log('Reading backup file for restoration...');
    const content = fs.readFileSync(filePath, 'utf8');
    const sqlStatements = content
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Found ${sqlStatements.length} SQL statements to execute`);
    const batchSize = payload.options?.batchSize || 100;

    for (let i = 0; i < sqlStatements.length; i += batchSize) {
      const batch = sqlStatements.slice(i, i + batchSize);

      for (const statement of batch) {
        try {
          await prisma.$executeRawUnsafe(statement);
          recordsProcessed++;

          const tableMatch = statement.match(/(?:INSERT INTO|UPDATE)\s+`?(\w+)`?/i);
          if (tableMatch && !tablesRestored.includes(tableMatch[1])) {
            tablesRestored.push(tableMatch[1]);
          }
        } catch (error) {
          console.warn(`Failed to execute statement: ${statement.substring(0, 100)}...`, error);
          if (String(error).includes('syntax error')) throw error;
        }
      }

      console.log(`Processed batch ${Math.ceil((i + batchSize) / batchSize)} of ${Math.ceil(sqlStatements.length / batchSize)}`);
    }

    const duration = `${Date.now() - startTime}ms`;
    console.log(`Restoration completed. Records: ${recordsProcessed}, Tables: ${tablesRestored.length}, Duration: ${duration}`);

    return { recordsProcessed, tablesRestored, duration };
  }

  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Temporary backup file cleaned up:', filePath);
      }
    } catch (error) {
      console.warn('Failed to cleanup temporary file:', error);
    }
  }
}

export const restoreWorker = new RestoreWorker('./restore.worker.ts');
