import { PrismaClient } from '@prisma/client';
import amqplib, { Channel, Connection, Message } from 'amqplib';
import { RABBITMQ_URL } from '../env';
import { logInfo, logError } from '../middlewares/logger.middle';
const prisma = new PrismaClient();

const RABBIT_URL = RABBITMQ_URL;
const JOB_QUEUE = 'job-queue';

let channel: any = null;
let rabbitInstance: any = null;

// Initialize RabbitMQ channel and instance
export async function getChannel(): Promise<Channel | undefined> {
  if (channel) return channel;
  try {
    const conn = await amqplib.connect(RABBIT_URL);
    if (!conn) throw new Error('Failed to connect to RabbitMQ');
    rabbitInstance = conn;

    if (conn) {
      const ch = await conn.createChannel();
      if (!ch) throw new Error('Failed to create RabbitMQ channel');
      channel = ch;
      await channel.assertQueue(JOB_QUEUE, { durable: true });
      return channel;
    }

    return undefined;
  } catch (err) {
    logError('RabbitMQ connection/channel error', {
      error: err,
      file: 'job.service.ts',
      line: '22',
    });
    throw err;
  }
}

// Export RabbitMQ instance for health checks
export function getRabbitInstance(): Connection | null {
  return rabbitInstance;
}

// Ping RabbitMQ connection
export async function pingRabbitMQ(): Promise<boolean> {
  try {
    const conn = await amqplib.connect(RABBIT_URL);
    await conn.close();
    return true;
  } catch (err) {
    return false;
  }
}

// // Ping RabbitMQ on startup
// pingRabbitMQ().then((ok) => {
//   if (ok) {
//     logInfo('✅ RabbitMQ connection successful', { file: 'job.service.ts', line: '38' });
//     logInfo('RabbitMQ UI available at http://localhost:15672', { file: 'job.service.ts', line: '39' });
//   } else {
//     logError('❌ RabbitMQ connection failed', { file: 'job.service.ts', line: '41' });
//   }
// });

// Supported job types
const JOB_TYPES = ['extract', 'file-tuning', 'backup'];

// Get job details with relations
export async function getJobDetail(id: string) {
  return prisma.job.findUnique({
    where: { id },
    include: {
      conversations: {
        include: {
          conversation: true,
        },
      },
      documents: {
        include: {
          document: true,
        },
      },
      databases: {
        include: {
          database: true,
        },
      },
      user: true,
    },
  });
}

// Add a job and send to RabbitMQ (Bull-like control)
export async function addJob(
  type: string,
  payload: any,
  userId?: string,
  description?: string,
  conversationIds?: string[],
): Promise<any> {
  if (!JOB_TYPES.includes(type)) {
    throw new Error(`Invalid job type: ${type}. Supported types: ${JOB_TYPES.join(', ')}`);
  }

  if (typeof payload !== 'object' || payload === null) {
    throw new Error('Payload must be an object');
  }

  const job = await prisma.job.create({
    data: {
      type,
      payload: JSON.stringify(payload),
      userId,
      description,
      conversations:
        conversationIds && conversationIds.length
          ? {
              create: conversationIds.map((id) => ({ conversationId: id })),
            }
          : undefined,
    },
  });

  const ch = await getChannel();
  if (ch) {
    ch.sendToQueue(JOB_QUEUE, Buffer.from(JSON.stringify({ jobId: job.id, type, payload })), {
      persistent: true,
    });
  }

  return job;
}

// Process jobs from RabbitMQ (Bull-like worker control)
export async function processJobs(
  handler: (job: { jobId: string; type: string; payload: any }) => Promise<void>,
): Promise<void> {
  const ch = await getChannel();
  if (ch) {
    ch.consume(
      JOB_QUEUE,
      async (msg: Message | null) => {
        if (!msg) return;
        try {
          const jobData = JSON.parse(msg.content.toString());
          await handler(jobData);
          ch.ack(msg);
        } catch (err) {
          ch.ack(msg); // Ack anyway to avoid infinite retry
        }
      },
      { noAck: false },
    );
  }
}

export async function getJobs() {
  return prisma.job.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function getJob(id: string) {
  return prisma.job.findUnique({ where: { id } });
}

export async function updateJob(
  id: string,
  data: Partial<{ status: string; result: any; error: string; startedAt: Date; finishedAt: Date }>,
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
        originalJob.description || undefined,
      );
    }
  }
  return updatedJob;
}

export async function deleteJob(id: string) {
  return prisma.job.delete({ where: { id } });
}
