import amqplib from 'amqplib';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const RABBIT_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const JOB_QUEUE = 'job-queue';

let channel: amqplib.Channel | null = null;

// Initialize RabbitMQ channel
async function getChannel() {
  if (channel) return channel;
  const conn = await amqplib.connect(RABBIT_URL);
  channel = await conn.createChannel();
  await channel.assertQueue(JOB_QUEUE, { durable: true });
  return channel;
}

// Supported job types
const JOB_TYPES = ['extract', 'file-tuning', 'backup'];

// Add a job and send to RabbitMQ (Bull-like control)
export async function addJob(
  type: string,
  payload: any,
  userId?: string,
  description?: string,
  conversationIds?: string[]
) {
  if (!JOB_TYPES.includes(type)) {
    throw new Error(`Invalid job type: ${type}. Supported types: ${JOB_TYPES.join(', ')}`);
  }

  // Validate payload structure per job type (optional, can be expanded)
  // For now, just ensure it's an object
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('Payload must be an object');
  }

  const job = await prisma.job.create({
    data: {
      type,
      payload: JSON.stringify(payload),
      userId,
      description,
      conversations: conversationIds && conversationIds.length
        ? {
            create: conversationIds.map((id) => ({ conversationId: id })),
          }
        : undefined,
    },
  });

  const ch = await getChannel();
  // The message structure is Bull-like: { jobId, type, payload }
  ch.sendToQueue(JOB_QUEUE, Buffer.from(JSON.stringify({ jobId: job.id, type, payload })), {
    persistent: true,
  });

  return job;
}

// Process jobs from RabbitMQ (Bull-like worker control)
export async function processJobs(
  handler: (job: { jobId: string; type: string; payload: any }) => Promise<void>
) {
  const ch = await getChannel();
  ch.consume(
    JOB_QUEUE,
    async (msg) => {
      if (!msg) return;
      try {
        const jobData = JSON.parse(msg.content.toString());
        await handler(jobData);
        ch.ack(msg);
      } catch (err) {
        // Optionally: ch.nack(msg, false, false); // discard on error
        ch.ack(msg); // Ack anyway to avoid infinite retry
      }
    },
    { noAck: false }
  );
}

export async function getJobs() {
  return prisma.job.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function getJob(id: string) {
  return prisma.job.findUnique({ where: { id } });
}

export async function updateJob(
  id: string,
  data: Partial<{ status: string; result: any; error: string; startedAt: Date; finishedAt: Date }>
) {
  // If status is 'closed', mark finishedAt and optionally restart
  let updatedJob = await prisma.job.update({
    where: { id },
    data: {
      ...data,
      result: data.result ? JSON.stringify(data.result) : undefined,
      finishedAt: data.status === 'closed' ? new Date() : data.finishedAt,
    },
  });

  // If status is 'restart', create a new job with same type and payload
  if (data.status === 'restart') {
    // Fetch the original job
    const originalJob = await prisma.job.findUnique({ where: { id } });
    if (originalJob) {
      // Reuse type, payload, userId, description, conversations
      const payload = originalJob.payload ? JSON.parse(originalJob.payload) : {};
      updatedJob = await addJob(
        originalJob.type,
        payload,
        originalJob.userId ?? undefined,
        originalJob.description || undefined
      );
    }
  }
  return updatedJob;
}

export async function deleteJob(id: string) {
  return prisma.job.delete({ where: { id } });
}