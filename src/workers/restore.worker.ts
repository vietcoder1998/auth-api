import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { 
  RestoreJobPayload, 
  WorkerJobData, 
  WorkerEnvironment,
  WorkerResponse 
} from '../interfaces/worker.interface';

const prisma = new PrismaClient();

// Get job data from environment variables if available
const env: WorkerEnvironment = {
  jobId: process.env.JOB_ID,
  jobType: process.env.JOB_TYPE,
  jobPayload: process.env.JOB_PAYLOAD,
  workerId: process.env.WORKER_ID,
  userId: process.env.USER_ID
};

// If job data is in environment variables, process immediately
if (env.jobId && env.jobType) {
  const payload: RestoreJobPayload = env.jobPayload ? JSON.parse(env.jobPayload) : {
    jobId: env.jobId,
    type: env.jobType,
    workerId: env.workerId,
    userId: env.userId,
    backupUrl: '' // This should be provided in the payload
  };
  processJob({ jobId: env.jobId, type: env.jobType, payload });
}

// Handle messages from parent process
process.on('message', async (job: WorkerJobData<RestoreJobPayload>) => {
  await processJob(job);
});

async function processJob(job: WorkerJobData<RestoreJobPayload>) {
  try {
    console.log('Starting restore job...', { jobId: job.payload.jobId, url: job.payload.backupUrl });
    
    // Validate payload
    if (!job.payload.backupUrl) {
      throw new Error('Backup URL is required');
    }

    // Download backup file
    const tempFilePath = await downloadBackupFile(job.payload.backupUrl, job.payload.jobId);
    
    // Validate backup file
    if (job.payload.options?.validate !== false) {
      await validateBackupFile(tempFilePath);
    }

    // Restore data to database
    const result = await restoreToDatabase(tempFilePath, job.payload);
    
    // Clean up temporary file
    await cleanupTempFile(tempFilePath);

    // Update job status in database
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

    // Send success response
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
    
    // Update job status with error
    await prisma.job.update({
      where: { id: job.payload.jobId },
      data: {
        status: 'failed',
        error: String(error),
        finishedAt: new Date(),
      },
    });

    // Send error response
    const response: WorkerResponse = {
      success: false,
      data: { 
        jobId: job.payload.jobId, 
        type: job.payload.type 
      },
      error: String(error)
    };
    process.send?.(response);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

async function downloadBackupFile(url: string, jobId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(process.cwd(), 'temp', 'restores');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

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
      fs.unlink(tempFilePath, () => {}); // Clean up on error
      reject(new Error(`Download failed: ${error.message}`));
    });

    file.on('error', (error) => {
      fs.unlink(tempFilePath, () => {}); // Clean up on error
      reject(new Error(`File write failed: ${error.message}`));
    });

    // Set timeout for download
    request.setTimeout(300000, () => { // 5 minutes timeout
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

async function validateBackupFile(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if file exists and is readable
    if (!fs.existsSync(filePath)) {
      reject(new Error('Backup file not found'));
      return;
    }

    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      reject(new Error('Backup file is empty'));
      return;
    }

    // Read first few lines to validate SQL format
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(1024);
    const bytesRead = fs.readSync(fd, buffer, 0, 1024, 0);
    fs.closeSync(fd);

    const content = buffer.toString('utf8', 0, bytesRead);
    
    // Basic validation for SQL backup file
    if (!content.includes('INSERT') && !content.includes('CREATE') && !content.includes('UPDATE')) {
      reject(new Error('Invalid backup file format'));
      return;
    }

    console.log('Backup file validation passed');
    resolve();
  });
}

async function restoreToDatabase(filePath: string, payload: RestoreJobPayload): Promise<{
  recordsProcessed: number;
  tablesRestored: string[];
  duration: string;
}> {
  const startTime = Date.now();
  let recordsProcessed = 0;
  const tablesRestored: string[] = [];

  try {
    console.log('Reading backup file for restoration...');
    
    const content = fs.readFileSync(filePath, 'utf8');
    const sqlStatements = content
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Found ${sqlStatements.length} SQL statements to execute`);

    const batchSize = payload.options?.batchSize || 100;
    
    // Process SQL statements in batches
    for (let i = 0; i < sqlStatements.length; i += batchSize) {
      const batch = sqlStatements.slice(i, i + batchSize);
      
      for (const statement of batch) {
        try {
          // Execute raw SQL statement
          await prisma.$executeRawUnsafe(statement);
          recordsProcessed++;
          
          // Extract table name from INSERT/UPDATE statements
          const tableMatch = statement.match(/(?:INSERT INTO|UPDATE)\s+`?(\w+)`?/i);
          if (tableMatch && !tablesRestored.includes(tableMatch[1])) {
            tablesRestored.push(tableMatch[1]);
          }
        } catch (error) {
          console.warn(`Failed to execute statement: ${statement.substring(0, 100)}...`, error);
          // Continue with other statements unless it's a critical error
          if (String(error).includes('syntax error')) {
            throw error;
          }
        }
      }
      
      console.log(`Processed batch ${Math.ceil((i + batchSize) / batchSize)} of ${Math.ceil(sqlStatements.length / batchSize)}`);
    }

    const duration = `${Date.now() - startTime}ms`;
    console.log(`Restoration completed. Records: ${recordsProcessed}, Tables: ${tablesRestored.length}, Duration: ${duration}`);

    return {
      recordsProcessed,
      tablesRestored,
      duration
    };

  } catch (error) {
    console.error('Database restoration failed:', error);
    throw new Error(`Restoration failed: ${error}`);
  }
}

async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Temporary backup file cleaned up:', filePath);
    }
  } catch (error) {
    console.warn('Failed to cleanup temporary file:', error);
    // Don't throw error for cleanup failure
  }
}

// Handle process termination
process.on('SIGTERM', async () => {
  console.log('Restore worker received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Restore worker received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});