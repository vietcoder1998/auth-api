import { parentPort } from 'worker_threads';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Listen for job data from parent
parentPort?.on('message', async (job: { jobId: string; type: string; payload: any }) => {
  try {
    // Example: perform extract logic here
    console.log("good morning")
    // Replace with your actual extract implementation
    // Simulate work
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Update job status/result in DB
    await prisma.job.update({
      where: { id: job.jobId },
      data: {
        status: 'completed',
        result: JSON.stringify({ message: 'Extract job completed', payload: job.payload }),
        finishedAt: new Date(),
      },
    });
    parentPort?.postMessage({ success: true, jobId: job.jobId });
  } catch (error) {
    await prisma.job.update({
      where: { id: job.jobId },
      data: {
        status: 'failed',
        error: String(error),
        finishedAt: new Date(),
      },
    });
    parentPort?.postMessage({ success: false, jobId: job.jobId, error });
  } finally {
    await prisma.$disconnect();
  }
});
