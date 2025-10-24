import { PrismaClient } from '@prisma/client';
import amqplib, { Channel, Message } from 'amqplib';
import { Worker } from 'worker_threads';
import { RABBITMQ_URL } from '../env';
import { logError, logInfo } from '../middlewares/logger.middle';

class JobQueue {
  async sendToQueue(job: any): Promise<void> {
    const ch = await this.getChannel();
    if (ch) {
      ch.sendToQueue('job-queue', Buffer.from(JSON.stringify({ jobId: job.id, type: job.type, payload: JSON.parse(job.payload || '{}') })), {
        persistent: true,
      });
    }
  }
  prisma: PrismaClient;
  channel: Channel | null = null;
  rabbitInstance: amqplib.ChannelModel | null = null;
  JOB_QUEUE = 'job-queue';
  JOB_TYPES = ['extract', 'file-tuning', 'backup'];
  WORKER_PATHS: Record<string, string> = {
    extract: require.resolve('../workers/extract.workers.ts'),
    backup: require.resolve('../workers/backup.works.ts'),
    'file-tuning': require.resolve('../workers/fine-tuning.workers.ts'),
  };

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getChannel(): Promise<Channel | null | undefined> {
    if (this.channel) return this.channel;
    if (this.channel === null) return undefined;
    try {
      const conn = await amqplib.connect(RABBITMQ_URL);
      if (!conn) throw new Error('Failed to connect to RabbitMQ');
      this.rabbitInstance = conn;
      const ch: Channel = await (conn as any).createChannel();
      if (!ch) throw new Error('Failed to create RabbitMQ channel');
      this.channel = ch;
      if (this.channel) {
        await this.channel.assertQueue(this.JOB_QUEUE, { durable: true });
      }
      return this.channel;
    } catch (err) {
      logError('RabbitMQ connection/channel error', {
        error: err,
        file: 'job.service.ts',
        line: '22',
      });
      throw err;
    }
  }

  getRabbitInstance(): amqplib.ChannelModel | null {
    return this.rabbitInstance;
  }

  async pingRabbitMQ(): Promise<boolean> {
    try {
      const conn = await amqplib.connect(RABBITMQ_URL);
      await conn.close();
      return true;
    } catch (err) {
      return false;
    }
  }

  async getJobDetail(id: string) {
    return this.prisma.job.findUnique({
      where: { id },
      include: {
        conversations: { include: { conversation: true } },
        documents: { include: { document: true } },
        databases: { include: { database: true } },
        user: true,
      },
    });
  }

  async addJob(
    type: string,
    payload: any,
    userId?: string,
    description?: string,
    conversationIds?: string[],
  ): Promise<any> {
    if (!this.JOB_TYPES.includes(type)) {
      throw new Error(`Invalid job type: ${type}. Supported types: ${this.JOB_TYPES.join(', ')}`);
    }
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Payload must be an object');
    }
    const job = await this.prisma.job.create({
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
    const ch = await this.getChannel();
    if (ch) {
      ch.sendToQueue(
        this.JOB_QUEUE,
        Buffer.from(JSON.stringify({ jobId: job.id, type, payload })),
        {
          persistent: true,
        },
      );
    }
    return job;
  }

  async processJobs(
    handler: (job: { jobId: string; type: string; payload: any }) => Promise<void>,
  ): Promise<void> {
    const ch = await this.getChannel();
    if (ch) {
      ch.consume(
        this.JOB_QUEUE,
        async (msg: Message | null) => {
          if (!msg) return;
          try {
            const jobData = JSON.parse(msg.content.toString());
            let workerPath = this.WORKER_PATHS[jobData.type];
            if (!workerPath) {
              workerPath = require.resolve('../workers/generic.job.worker.js');
            }
            const worker = new Worker(workerPath);
            worker.postMessage(jobData);
            worker.on('message', (result) => {
              logInfo(`${jobData.type} worker finished`, { jobId: jobData.jobId, result });
              worker.terminate();
            });
            worker.on('error', (error) => {
              logError(`${jobData.type} worker error`, { jobId: jobData.jobId, error });
              worker.terminate();
            });
            ch.ack(msg);
          } catch (err) {
            ch.ack(msg);
          }
        },
        { noAck: false },
      );
    }
  }

  async getJobs() {
    return this.prisma.job.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getJob(id: string) {
    return this.prisma.job.findUnique({ where: { id } });
  }

  async updateJob(
    id: string,
    data: Partial<{
      status: string;
      result: any;
      error: string;
      startedAt: Date;
      finishedAt: Date;
    }>,
  ) {
    let updatedJob = await this.prisma.job.update({
      where: { id },
      data: {
        ...data,
        result: data.result ? JSON.stringify(data.result) : undefined,
        finishedAt: data.status === 'closed' ? new Date() : data.finishedAt,
      },
    });
    if (data.status === 'restart') {
      const originalJob = await this.prisma.job.findUnique({ where: { id } });
      if (originalJob) {
        const payload = originalJob.payload ? JSON.parse(originalJob.payload) : {};
        updatedJob = await this.addJob(
          originalJob.type,
          payload,
          originalJob.userId ?? undefined,
          originalJob.description || undefined,
        );
      }
    }
    return updatedJob;
  }

  async deleteJob(id: string) {
    return this.prisma.job.delete({ where: { id } });
  }
}

export const jobQueue = new JobQueue();

jobQueue.processJobs(async (job) => {
  logError('No handler for job type', { type: job.type, jobId: job.jobId });
});
