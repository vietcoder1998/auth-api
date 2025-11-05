import {
  JobResultDro,
  JobResultDto,
  JobResultFilter,
  JobResultModel,
} from '../interfaces/job-result.interface';
import { prisma } from '../setup';
import { BaseRepository } from './base.repository';

export class JobResultRepository extends BaseRepository<
  JobResultModel,
  JobResultDto,
  JobResultDro
> {
  private jobResultModel: JobResultModel = prisma.jobResult;

  constructor() {
    super(prisma.jobResult);
  }

  /**
   * Transform model to DRO with parsed JSON fields
   */
  protected toDro(model: JobResultDto): JobResultDro {
    return {
      id: model.id,
      jobId: model.jobId,
      status: model.status,
      result: model.result ? this.parseJson(model.result) : null,
      error: model.error,
      processingTime: model.processingTime,
      metadata: model.metadata ? this.parseJson(model.metadata) : null,
      createdAt: model.createdAt,
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
   * Find results by job ID
   */
  async findByJobId(jobId: string): Promise<JobResultDro[]> {
    if (!this.jobResultModel) {
      throw new Error('JobResult model is undefined.');
    }
    const results = (await this.jobResultModel!.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
    })) as JobResultDto[];

    return results.map((result) => this.toDro(result));
  }

  /**
   * Find results by status
   */
  async findByStatus(status: string): Promise<JobResultDro[]> {
    const results = (await this.jobResultModel!.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    })) as JobResultDto[];

    return results.map((result) => this.toDro(result));
  }

  /**
   * Find latest result for a job
   */
  async findLatestByJobId(jobId: string): Promise<JobResultDro | null> {
    const result = (await this.jobResultModel.findFirst({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
    })) as JobResultModel | null;

    return result ? this.toDro(result as JobResultDto) : null;
  }

  /**
   * Find results with filters
   */
  async findByFilter(filter: JobResultFilter): Promise<JobResultDro[]> {
    const where: any = {};

    if (filter.jobId) where.jobId = filter.jobId;
    if (filter.status) where.status = filter.status;

    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = filter.startDate;
      if (filter.endDate) where.createdAt.lte = filter.endDate;
    }

    if (!this.jobResultModel) {
      throw new Error('JobResult model is undefined.');
    }
    const results = await this.jobResultModel.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    }) as JobResultDto[];

    return results.map((result) => this.toDro(result));
  }

  /**
   * Get average processing time for a job type
   */
  async getAverageProcessingTime(jobId?: string): Promise<number> {
    const result = await this.jobResultModel.aggregate({
      where: jobId ? { jobId } : undefined,
      _avg: {
        processingTime: true,
      },
    });

    return result._avg.processingTime || 0;
  }

  /**
   * Get result statistics
   */
  async getStats(jobId?: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    avgProcessingTime: number;
  }> {
    const where = jobId ? { jobId } : undefined;

    const [total, completed, failed, avgResult] = await Promise.all([
      this.jobResultModel.count({ where }),
      this.jobResultModel.count({ where: { ...where, status: 'completed' } }),
      this.jobResultModel.count({ where: { ...where, status: 'failed' } }),
      this.jobResultModel.aggregate({
        where,
        _avg: { processingTime: true },
      }),
    ]);

    return {
      total,
      completed,
      failed,
      avgProcessingTime: avgResult._avg.processingTime || 0,
    };
  }

  /**
   * Delete old results
   */
  async deleteOldResults(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.jobResultModel.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Delete results by job ID
   */
  async deleteByJobId(jobId: string): Promise<number> {
    const result = await this.jobResultModel.deleteMany({
      where: { jobId },
    });

    return result.count;
  }

  /**
   * Override create to handle JSON stringification
   */
  override async create<T = any, R = any>(data: T): Promise<R> {
    const resultData = data as any;

    // Stringify JSON fields if they are objects
    if (resultData.result && typeof resultData.result === 'object') {
      resultData.result = JSON.stringify(resultData.result);
    }
    if (resultData.metadata && typeof resultData.metadata === 'object') {
      resultData.metadata = JSON.stringify(resultData.metadata);
    }

    const createdResult = await super.create(resultData) as JobResultDto;
    return this.toDro(createdResult) as R;
  }

  /**
   * Override update to handle JSON stringification
   */
  override async update<T = any, R = any>(id: string, data: Partial<T>): Promise<R> {
    const updateData = { ...data } as any;

    // Stringify JSON fields if they are objects
    if (updateData.result && typeof updateData.result === 'object') {
      updateData.result = JSON.stringify(updateData.result);
    }
    if (updateData.metadata && typeof updateData.metadata === 'object') {
      updateData.metadata = JSON.stringify(updateData.metadata);
    }

    const result = await super.update(id, updateData) as JobResultDto;
    return this.toDro(result) as R;
  }

  /**
   * Get all results with related job information
   */
  async findAllWithJob(): Promise<any[]> {
    if (!this.jobResultModel) {
      throw new Error('JobResult model is undefined.');
    }
    if (!this.jobResultModel) {
      throw new Error('JobResult model is undefined.');
    }
    return await this.jobResultModel!.findMany({
      include: {
        job: {
          select: {
            id: true,
            type: true,
            status: true,
            userId: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find results by job ID with job information
   */
  async findByJobIdWithJob(jobId: string): Promise<any[]> {
    if (!this.jobResultModel) {
      throw new Error('JobResult model is undefined.');
    }
    return await this.jobResultModel.findMany({
      where: { jobId },
      include: {
        job: {
          select: {
            id: true,
            type: true,
            status: true,
            userId: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const jobResultRepository = new JobResultRepository();
