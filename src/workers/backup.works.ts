import { parentPort } from 'worker_threads';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

parentPort?.on('message', async (job: { jobId: string; type: string; payload: any }) => {
  try {
    // Example: perform backup logic here
    console.log('Starting backup job...');
    // Simulate backup work
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Update job status/result in DB
    await prisma.job.update({
      where: { id: job.jobId },
      data: {
        status: 'completed',
        result: JSON.stringify({ message: 'Backup job completed', payload: job.payload }),
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
