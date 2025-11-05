import { JobDro, JobDto, JobFilter, JobModel, JobStats } from '../interfaces';
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
  protected toDro(model: JobModel): JobDro {
    return {
      ...model,
      createdAt: model.createdAt ?? new Date(0),
      updatedAt: model.updatedAt ?? new Date(0),
      priority: model.priority ?? 0,
      payload: model.payload ? this.parseJson(model.payload) : null,
      result: model.result ? this.parseJson(model.result) : null,
      metadata: model.metadata ? this.parseJson(model.metadata) : null,
      retries: model.retries ?? 0,
      maxRetries: model.maxRetries ?? 0,
      progress: model.progress ?? 0,
    };
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
    const jobs = (await this.jobModel?.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    })) as JobModel[];

    return jobs.map((job) => this.toDro(job));
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
    const jobs = (await this.jobModel.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
    })) as JobModel[];

    return jobs.map((job) => this.toDro(job));
  }

  /**
   * Find jobs by queue name
   */
  async findByQueue(queueName: string): Promise<JobDro[]> {
    const jobs = (await this.jobModel.findMany({
      where: { queueName },
      orderBy: { createdAt: 'desc' },
    })) as JobModel[];

    return jobs.map((job) => this.toDro(job));
  }

  /**
   * Find jobs by worker ID
   */
  async findByWorker(workerId: string): Promise<JobDro[]> {
    const jobs = (await this.jobModel.findMany({
      where: { workerId },
      orderBy: { createdAt: 'desc' },
    })) as JobModel[];

    return jobs.map((job) => this.toDro(job));
  }

  /**
   * Find jobs by user ID
   */
  async findByUser(userId: string): Promise<JobDro[]> {
    const jobs = (await this.jobModel.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })) as JobModel[];

    return jobs.map((job) => this.toDro(job));
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

    const jobs = (await this.jobModel.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })) as JobModel[];

    return jobs.map((job) => this.toDro(job));
  }

  /**
   * Find failed jobs that can be retried
   */
  async findRetryable(): Promise<JobDro[]> {
    const jobs = (await this.jobModel.findMany({
      where: {
        status: 'failed',
        retries: {
          lt: 3, // Replace with your desired maxRetries value or make it configurable
        },
      },
      orderBy: { createdAt: 'asc' },
    })) as JobModel[];

    return jobs.map((job) => this.toDro(job));
  }

  /**
   * Increment retry count
   */
  async incrementRetries(id: string): Promise<JobDro> {
    const job = (await this.jobModel.update({
      where: { id },
      data: {
        retries: {
          increment: 1,
        },
      },
    })) as JobModel;

    return this.toDro(job);
  }

  /**
   * Update job progress
   */
  async updateProgress(id: string, progress: number): Promise<JobDro> {
    const job = (await this.jobModel.update({
      where: { id },
      data: { progress },
    })) as JobModel;

    return this.toDro(job);
  }

  /**
   * Mark job as started
   */
  async markStarted(id: string, workerId: string): Promise<JobDro> {
    const job = (await this.jobModel.update({
      where: { id },
      data: {
        status: 'processing',
        workerId,
        startedAt: new Date(),
      },
    })) as JobModel;

    return this.toDro(job);
  }

  /**
   * Mark job as completed
   */
  async markCompleted(id: string, result?: any): Promise<JobDro> {
    const job = (await this.jobModel.update({
      where: { id },
      data: {
        status: 'completed',
        result: result ? JSON.stringify(result) : undefined,
        progress: 100,
        finishedAt: new Date(),
      },
    })) as JobModel;

    return this.toDro(job);
  }

  /**
   * Mark job as failed
   */
  async markFailed(id: string, error: string): Promise<JobDro> {
    const job = (await this.jobModel.update({
      where: { id },
      data: {
        status: 'failed',
        error,
        finishedAt: new Date(),
      },
    })) as JobModel;

    return this.toDro(job);
  }

  /**
   * Mark job as cancelled
   */
  async markCancelled(id: string): Promise<JobDro> {
    const job = (await this.jobModel.update({
      where: { id },
      data: {
        status: 'cancelled',
        finishedAt: new Date(),
      },
    })) as JobModel;

    return this.toDro(job);
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
    const jobData = data as any;

    // Stringify JSON fields if they are objects
    if (jobData.payload && typeof jobData.payload === 'object') {
      jobData.payload = JSON.stringify(jobData.payload);
    }
    if (jobData.result && typeof jobData.result === 'object') {
      jobData.result = JSON.stringify(jobData.result);
    }
    if (jobData.metadata && typeof jobData.metadata === 'object') {
      jobData.metadata = JSON.stringify(jobData.metadata);
    }

    const job = await super.create(jobData);
    return this.toDro(job as JobModel) as R;
  }

  /**
   * Override update to handle JSON stringification
   */
  override async update<Dto = JobDto, Dro = JobDro>(id: string, data: Partial<Dto>): Promise<Dro> {
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
    return this.toDro(job as JobModel) as Dro;
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
