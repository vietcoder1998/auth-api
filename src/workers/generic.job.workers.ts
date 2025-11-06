import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { 
  GenericJobPayload, 
  WorkerJobData, 
  WorkerEnvironment,
  WorkerResponse,
  WorkerProcessResult
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
  const payload: GenericJobPayload = env.jobPayload ? JSON.parse(env.jobPayload) : {
    jobId: env.jobId,
    type: env.jobType,
    workerId: env.workerId,
    userId: env.userId,
    operation: env.jobType
  };
  processJob({ jobId: env.jobId, type: env.jobType, payload });
}

// Handle messages from parent process
process.on('message', async (jobData: WorkerJobData<GenericJobPayload>) => {
  await processJob(jobData);
});

async function processJob(jobData: WorkerJobData<GenericJobPayload>): Promise<void> {
  try {
    switch (jobData.payload.operation || jobData.type) {
      case 'extract': {
        // Example: backup all tables to a JSON file
        const tables = await prisma.$queryRawUnsafe<any[]>("SHOW TABLES");
        const dbBackup: Record<string, any[]> = {};
        for (const tableObj of tables) {
          const tableName = String(Object.values(tableObj)[0]);
          const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM \`${tableName}\``);
          dbBackup[tableName] = rows;
        }
        const backupDir = path.resolve(__dirname, '../../backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
        const backupFile = path.join(backupDir, `db-backup-${jobData.payload.jobId}.json`);
        
        // Handle BigInt serialization
        const safeStringify = (obj: any): string => {
          return JSON.stringify(obj, (key: string, value: any) =>
            typeof value === 'bigint' ? value.toString() : value
          , 2);
        };
        
        fs.writeFileSync(backupFile, safeStringify(dbBackup), 'utf8');
        
        const result: WorkerProcessResult = {
          status: 'success',
          data: { backupFile },
          recordsProcessed: Object.values(dbBackup).reduce((sum, rows) => sum + rows.length, 0),
          tablesProcessed: Object.keys(dbBackup)
        };
        
        const response: WorkerResponse = {
          success: true,
          data: {
            jobId: jobData.payload.jobId,
            type: jobData.payload.type,
            result: 'Extract completed successfully',
            details: result,
            payload: jobData.payload
          }
        };
        process.send?.(response);
        break;
      }
      default:
        const noOpResult: WorkerProcessResult = {
          status: 'no-op',
          data: { type: jobData.payload.operation || jobData.type }
        };
        
        const noOpResponse: WorkerResponse = {
          success: true,
          data: {
            jobId: jobData.payload.jobId,
            type: jobData.payload.type,
            result: 'No operation performed',
            details: noOpResult,
            payload: jobData.payload
          }
        };
        process.send?.(noOpResponse);
    }
  } catch (err: any) {
    const errorResponse: WorkerResponse = {
      success: false,
      data: {
        jobId: jobData.payload.jobId,
        type: jobData.payload.type
      },
      error: err?.message || String(err)
    };
    process.send?.(errorResponse);
  }
}
