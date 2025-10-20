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

// Add a job and send to RabbitMQ (Bull-like control)
export async function addJob(
  type: string,
  payload: any,
  userId?: string,
  description?: string,
  conversationIds?: string[]
) {
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
  return prisma.job.update({
    where: { id },
    data: {
      ...data,
      result: data.result ? JSON.stringify(data.result) : undefined,
    },
  });
}

export async function deleteJob(id: string) {
  return prisma.job.delete({ where: { id } });
}