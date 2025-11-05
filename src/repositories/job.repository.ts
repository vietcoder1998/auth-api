import { BaseRepository } from './base.repository';
import { PrismaClient } from '@prisma/client';

export interface Job {
  id: string;
  type: string;
  status: string;
  queueName?: string;
  workerId?: string;
  payload?: string;
  result?: string;
  error?: string;
  priority?: number;
  retries?: number;
  maxRetries?: number;
  progress?: number;
  timeout?: number;
  metadata?: string;
  userId?: string;
  startedAt?: Date;
  finishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class JobRepository extends BaseRepository<Job, Job, Job> {
  constructor(prisma?: PrismaClient) {
    const prismaInstance = prisma || (global as any).prisma;
    if (!prismaInstance?.job) {
      throw new Error('Prisma job model not available. Make sure to run migrations.');
    }
    super(prismaInstance.job);
  }

  /**
   * Find jobs by status
   */
  async findByStatus(status: string): Promise<Job[]> {
    return this.model.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    }) as Promise<Job[]>;
  }

  /**
   * Find pending jobs
   */
  async findPending(): Promise<Job[]> {
    return this.findByStatus('pending');
  }

  /**
   * Find processing jobs
   */
  async findProcessing(): Promise<Job[]> {
    return this.findByStatus('processing');
  }

  /**
   * Find jobs by type
   */
  async findByType(type: string): Promise<Job[]> {
    return this.model.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
    }) as Promise<Job[]>;
  }

  /**
   * Find jobs by queue name
   */
  async findByQueue(queueName: string): Promise<Job[]> {
    return this.model.findMany({
      where: { queueName },
      orderBy: { createdAt: 'desc' },
    }) as Promise<Job[]>;
  }

  /**
   * Find jobs by worker ID
   */
  async findByWorker(workerId: string): Promise<Job[]> {
    return this.model.findMany({
      where: { workerId },
      orderBy: { createdAt: 'desc' },
    }) as Promise<Job[]>;
  }

  /**
   * Find jobs by user ID
   */
  async findByUser(userId: string): Promise<Job[]> {
    return this.model.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }) as Promise<Job[]>;
  }

  /**
   * Find failed jobs that can be retried
   */
  async findRetryable(): Promise<Job[]> {
    return this.model.findMany({
      where: {
        status: 'failed',
        retries: {
          lt: this.model.fields.maxRetries,
        },
      },
      orderBy: { createdAt: 'asc' },
    }) as Promise<Job[]>;
  }

  /**
   * Increment retry count
   */
  async incrementRetries(id: string): Promise<Job> {
    return this.model.update({
      where: { id },
      data: {
        retries: {
          increment: 1,
        },
      },
    }) as Promise<Job>;
  }

  /**
   * Update job progress
   */
  async updateProgress(id: string, progress: number): Promise<Job> {
    return this.model.update({
      where: { id },
      data: { progress },
    }) as Promise<Job>;
  }

  /**
   * Mark job as started
   */
  async markStarted(id: string, workerId: string): Promise<Job> {
    return this.model.update({
      where: { id },
      data: {
        status: 'processing',
        workerId,
        startedAt: new Date(),
      },
    }) as Promise<Job>;
  }

  /**
   * Mark job as completed
   */
  async markCompleted(id: string, result?: any): Promise<Job> {
    return this.model.update({
      where: { id },
      data: {
        status: 'completed',
        result: result ? JSON.stringify(result) : undefined,
        progress: 100,
        finishedAt: new Date(),
      },
    }) as Promise<Job>;
  }

  /**
   * Mark job as failed
   */
  async markFailed(id: string, error: string): Promise<Job> {
    return this.model.update({
      where: { id },
      data: {
        status: 'failed',
        error,
        finishedAt: new Date(),
      },
    }) as Promise<Job>;
  }

  /**
   * Get job statistics
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const [total, pending, processing, completed, failed] = await Promise.all([
      this.model.count(),
      this.model.count({ where: { status: 'pending' } }),
      this.model.count({ where: { status: 'processing' } }),
      this.model.count({ where: { status: 'completed' } }),
      this.model.count({ where: { status: 'failed' } }),
    ]);

    return { total, pending, processing, completed, failed };
  }
}