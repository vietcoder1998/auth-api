import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get job data from environment variables if available
const jobId = process.env.JOB_ID;
const jobType = process.env.JOB_TYPE;
const jobPayload = process.env.JOB_PAYLOAD ? JSON.parse(process.env.JOB_PAYLOAD) : {};

// If job data is in environment variables, process immediately
if (jobId && jobType) {
  processJob({ jobId, type: jobType, payload: jobPayload });
}

// Handle messages from parent process
process.on('message', async (job: { jobId: string; type: string; payload: any }) => {
  await processJob(job);
});

async function processJob(job: { jobId: string; type: string; payload: any }) {
  try {
    // Example: perform fine-tuning logic here
    console.log('Starting fine-tuning job...');
    // Simulate fine-tuning work
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update job status/result in DB
    await prisma.job.update({
      where: { id: job.jobId },
      data: {
        status: 'completed',
        result: JSON.stringify({ message: 'Fine-tuning job completed', payload: job.payload }),
        finishedAt: new Date(),
      },
    });
    process.send?.({ success: true, data: { jobId: job.jobId } });
  } catch (error) {
    await prisma.job.update({
      where: { id: job.jobId },
      data: {
        status: 'failed',
        error: String(error),
        finishedAt: new Date(),
      },
    });
    process.send?.({ success: false, data: { jobId: job.jobId }, error });
  } finally {
    await prisma.$disconnect();
  }
}
