import { PrismaClient } from '@prisma/client';
import { 
  FineTuningJobPayload, 
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
  const payload: FineTuningJobPayload = env.jobPayload ? JSON.parse(env.jobPayload) : {
    jobId: env.jobId,
    type: env.jobType,
    workerId: env.workerId,
    userId: env.userId
  };
  processJob({ jobId: env.jobId, type: env.jobType, payload });
}

// Handle messages from parent process
process.on('message', async (job: WorkerJobData<FineTuningJobPayload>) => {
  await processJob(job);
});

async function processJob(job: WorkerJobData<FineTuningJobPayload>) {
  try {
    // Example: perform fine-tuning logic here
    console.log('Starting fine-tuning job...');
    // Simulate fine-tuning work
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update job status/result in DB
    await prisma.job.update({
      where: { id: job.payload.jobId },
      data: {
        status: 'completed',
        result: JSON.stringify({ message: 'Fine-tuning job completed', payload: job.payload }),
        finishedAt: new Date(),
      },
    });
    
    const response: WorkerResponse = {
      success: true,
      data: { 
        jobId: job.payload.jobId,
        type: job.payload.type,
        result: 'Fine-tuning job completed',
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
