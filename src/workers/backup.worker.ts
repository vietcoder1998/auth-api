import { PrismaClient } from '@prisma/client';
import { 
  BackupJobPayload, 
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
  const payload: BackupJobPayload = env.jobPayload ? JSON.parse(env.jobPayload) : {
    jobId: env.jobId,
    type: env.jobType,
    workerId: env.workerId,
    userId: env.userId
  };
  processJob({ jobId: env.jobId, type: env.jobType, payload });
}

// Handle messages from parent process
process.on('message', async (job: WorkerJobData<BackupJobPayload>) => {
  await processJob(job);
});

async function processJob(job: WorkerJobData<BackupJobPayload>) {
  try {
    // Example: perform backup logic here
    console.log('Starting backup job...');
    // Simulate backup work
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Update job status/result in DB
    await prisma.job.update({
      where: { id: job.payload.jobId },
      data: {
        status: 'completed',
        result: JSON.stringify({ message: 'Backup job completed', payload: job.payload }),
        finishedAt: new Date(),
      },
    });
    
    const response: WorkerResponse = {
      success: true,
      data: { 
        jobId: job.payload.jobId,
        type: job.payload.type,
        result: 'Backup job completed',
        payload: job.payload
      }
    };
    process.send?.(response);
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
        type: job.payload.type
      },
      error: String(error)
    };
    process.send?.(response);
  } finally {
    await prisma.$disconnect();
  }
}
