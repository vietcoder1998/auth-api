import { Prisma } from '@prisma/client';
import { JobDro, JobDto, JobFilter, JobStats, JobUpdateDto } from '../interfaces';
import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
export class JobRepository extends BaseRepository<typeof prisma.job, JobDto, JobDro> {
  constructor() {
    super(prisma.job);
  }

  private get jobModel() {
    return this.model;
  }
  /**
   * Transform model to DRO with parsed JSON fields
   */
  protected toDro(model: JobDto): JobDro {
    const job = model;
    return {
      ...job,
      id: job.id ?? '',
      createdAt: job.createdAt ?? new Date(0),
      updatedAt: job.updatedAt ?? new Date(0),
      priority: job.priority ?? 0,
      payload: typeof job.payload === 'string' ? this.parseJson(job.payload) : job.payload,
      result: typeof job.result === 'string' ? this.parseJson(job.result) : job.result,
      metadata:
        typeof job.metadata === 'string' ? this.parseJson(job.metadata) : (job.metadata ?? null),
      retries: job.retries ?? 0,
      maxRetries: job.maxRetries ?? 0,
      progress: job.progress ?? 0,
      type: job.type ?? '',
      status: job.status ?? '',
    } as JobDro;
  }

  /**
   * Helper to safely parse JSON
   */
  private parseJson(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch {
      return jsonString;
    }
  }

  /**
   * Find jobs by status
   */
  async findByStatus(status: string): Promise<JobDro[]> {
    const jobs = await this.jobModel.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });

    return jobs.map((job) => this.toDro(job as JobDto));
  }

  /**
   * Find pending jobs
   */
  async findPending(): Promise<JobDro[]> {
    return this.findByStatus('pending');
  }

  /**
   * Find processing jobs
   */
  async findProcessing(): Promise<JobDro[]> {
    return this.findByStatus('processing');
  }

  /**
   * Find jobs by type
   */
  async findByType(type: string): Promise<JobDro[]> {
    const jobs = await this.jobModel.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
    });

    return jobs.map((job) => this.toDro(job as JobDto));
  }

  /**
   * Find jobs by queue name
   */
  async findByQueue(queueName: string): Promise<JobDro[]> {
    const jobs = await this.jobModel.findMany({
      where: { queueName },
      orderBy: { createdAt: 'desc' },
    });

    return jobs.map((job) => this.toDro(job as JobDto));
  }

  /**
   * Find jobs by worker ID
   */
  async findByWorker(workerId: string): Promise<JobDro[]> {
    const jobs = await this.jobModel.findMany({
      where: { workerId },
      orderBy: { createdAt: 'desc' },
    });

    return jobs.map((job) => this.toDro(job as JobDto));
  }

  /**
   * Find jobs by user ID
   */
  async findByUser(userId: string): Promise<JobDro[]> {
    const jobs = await this.jobModel.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return jobs.map((job) => this.toDro(job as JobDto));
  }

  /**
   * Find jobs with filters
   */
  async findByFilter(filter: JobFilter): Promise<JobDro[]> {
    const where: any = {};

    if (filter.type) where.type = filter.type;
    if (filter.status) where.status = filter.status;
    if (filter.queueName) where.queueName = filter.queueName;
    if (filter.workerId) where.workerId = filter.workerId;
    if (filter.userId) where.userId = filter.userId;

    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = filter.startDate;
      if (filter.endDate) where.createdAt.lte = filter.endDate;
    }

    const jobs = await this.jobModel.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return jobs.map((job) => this.toDro(job as JobDto));
  }

  /**
   * Find failed jobs that can be retried
   */
  async findRetryable(): Promise<JobDro[]> {
    const jobs = await this.jobModel.findMany({
      where: {
        status: 'failed',
        retries: {
          lt: 3, // Replace with your desired maxRetries value or make it configurable
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return jobs.map((job) => this.toDro(job as JobDto));
  }

  /**
   * Increment retry count
   */
  async incrementRetries(id: string): Promise<JobDro> {
    const job = await this.jobModel.update({
      where: { id },
      data: {
        retries: {
          increment: 1,
        },
      },
    });

    return this.toDro(job as JobDto);
  }

  /**
   * Update job progress
   */
  async updateProgress(id: string, progress: number): Promise<JobDro> {
    const job = await this.jobModel.update({
      where: { id },
      data: { progress },
    });

    return this.toDro(job as JobDto);
  }

  /**
   * Mark job as started
   */
  async markStarted(id: string, workerId: string): Promise<JobDro> {
    const job = await this.jobModel.update({
      where: { id },
      data: {
        status: 'processing',
        workerId,
        startedAt: new Date(),
      },
    });

    return this.toDro(job as JobDto);
  }

  /**
   * Mark job as completed
   */
  async markCompleted(id: string, result?: any): Promise<JobDro> {
    const job = await this.jobModel.update({
      where: { id },
      data: {
        status: 'completed',
        result: result ? JSON.stringify(result) : undefined,
        progress: 100,
        finishedAt: new Date(),
      },
    });

    return this.toDro(job as JobDto);
  }

  /**
   * Mark job as failed
   */
  async markFailed(id: string, error: string): Promise<JobDro> {
    const job = await this.jobModel.update({
      where: { id },
      data: {
        status: 'failed',
        error,
        finishedAt: new Date(),
      },
    });

    return this.toDro(job as JobDto);
  }

  /**
   * Mark job as cancelled
   */
  async markCancelled(id: string): Promise<JobDro> {
    const job = await this.jobModel.update({
      where: { id },
      data: {
        status: 'cancelled',
        finishedAt: new Date(),
      },
    });
    return this.toDro(job as JobDto);
  }

  /**
   * Get job statistics
   */
  async getStats(): Promise<JobStats> {
    const [total, pending, processing, completed, failed, cancelled] = await Promise.all([
      this.jobModel.count(),
      this.jobModel.count({ where: { status: 'pending' } }),
      this.jobModel.count({ where: { status: 'processing' } }),
      this.jobModel.count({ where: { status: 'completed' } }),
      this.jobModel.count({ where: { status: 'failed' } }),
      this.jobModel.count({ where: { status: 'cancelled' } }),
    ]);

    return { total, pending, processing, completed, failed, cancelled };
  }

  /**
   * Delete old completed jobs
   */
  async deleteOldCompleted(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.jobModel.deleteMany({
      where: {
        status: 'completed',
        finishedAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Override create to handle JSON stringification
   */
  override async create<T = any, R = any>(data: T): Promise<R> {
    // Prepare JobCreateInput with correct types for JSON fields
    const createJobData: Prisma.JobCreateInput = {
      ...(data as JobDto),
      payload:
        (data as JobDto).payload && typeof (data as JobDto).payload === 'object'
          ? JSON.stringify((data as JobDto).payload)
          : ((data as JobDto).payload as string | null | undefined),
      result:
        (data as JobDto).result && typeof (data as JobDto).result === 'object'
          ? JSON.stringify((data as JobDto).result)
          : ((data as JobDto).result as string | null | undefined),
      metadata:
        (data as JobDto).metadata && typeof (data as JobDto).metadata === 'object'
          ? JSON.stringify((data as JobDto).metadata)
          : ((data as JobDto).metadata as string | null | undefined),
    };

    const job = await this.jobModel.create({ data: createJobData });
    return this.toDro(job as JobDto) as R;
  }

  /**
   * Override update to handle JSON stringification
   */
  override async update<Dto = JobUpdateDto, Dro = JobDro>(id: string, data: JobUpdateDto): Promise<Dro> {
    const updateData = { ...data } as any;

    // Stringify JSON fields if they are objects
    if (updateData.payload && typeof updateData.payload === 'object') {
      updateData.payload = JSON.stringify(updateData.payload);
    }
    if (updateData.result && typeof updateData.result === 'object') {
      updateData.result = JSON.stringify(updateData.result);
    }
    if (updateData.metadata && typeof updateData.metadata === 'object') {
      updateData.metadata = JSON.stringify(updateData.metadata);
    }

    const job = await super.update(id, updateData);
    return this.toDro(job as JobDto) as Dro;
  }

  /**
   * Find all jobs with user and results included
   */
  async findAllWithRelations(): Promise<any[]> {
    return await this.jobModel.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        results: true,
      },
    });
  }

  /**
   * Find job by ID with user and results included
   */
  async findByIdWithRelations(id: string): Promise<any> {
    return await this.jobModel.findUnique({
      where: { id },
      include: {
        user: true,
        results: true,
      },
    });
  }

  /**
   * Find job by ID with user included
   */
  async findByIdWithUser(id: string): Promise<any> {
    return await this.jobModel.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }
}

export const jobRepository = new JobRepository();
