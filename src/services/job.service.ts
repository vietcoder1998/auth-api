import { BaseService } from './base.service';
import { JobRepository } from '../repositories/job.repository';
import { JobResultRepository } from '../repositories/job-result.repository';
import { JobModel, JobDto, JobDro } from '../interfaces/job.interface';
import { JobResultDto, JobResultDro } from '../interfaces/job-result.interface';
import { RabbitMQRepository } from '../repositories/rabbitmq.repository';
import { logError, logInfo } from '../middlewares/logger.middle';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';

export interface JobMQPayloadDto {
  jobId: string;
  type: string;
  payload: any;
  userId?: string;
  priority?: number;
}

export class JobService extends BaseService<JobModel, JobDto, JobDro> {
  private readonly jobRepository: JobRepository;
  private readonly jobResultRepository: JobResultRepository;
  private readonly rabbitMQRepository: RabbitMQRepository;
  private readonly prisma: PrismaClient;

  constructor(
    jobRepository: JobRepository,
    jobResultRepository: JobResultRepository,
    rabbitMQRepository: RabbitMQRepository,
    prisma: PrismaClient
  ) {
    super();
    this.jobRepository = jobRepository;
    this.jobResultRepository = jobResultRepository;
    this.rabbitMQRepository = rabbitMQRepository;
    this.prisma = prisma;
  }

  /**
   * Get job model from repository
   */
  private get jobModel(): JobRepository {
    return this.jobRepository;
  }

  /**
   * Get job result model from repository
   */
  private get jobResultModel(): JobResultRepository {
    return this.jobResultRepository;
  }

  /**
   * Send job to message queue (RabbitMQ)
   * @param jobMQPayloadDto - The job payload to send to queue
   * @returns JobDto
   */
  public async sendToMQ(jobMQPayloadDto: JobMQPayloadDto): Promise<JobDto> {
    try {
      const job = await this.jobRepository.create({
        id: jobMQPayloadDto.jobId || uuidv4(),
        type: jobMQPayloadDto.type,
        status: 'pending',
        queueName: this.getQueueNameForType(jobMQPayloadDto.type),
        payload: jobMQPayloadDto.payload,
        userId: jobMQPayloadDto.userId,
        priority: jobMQPayloadDto.priority || 0,
      });

      const queueName = this.getQueueNameForType(jobMQPayloadDto.type);
      await this.rabbitMQRepository.publishToQueue(
        queueName,
        {
          jobId: job.id,
          type: jobMQPayloadDto.type,
          payload: jobMQPayloadDto.payload,
        },
        {
          persistent: true,
          priority: jobMQPayloadDto.priority || 0,
        }
      );

      logInfo('Job sent to queue', { jobId: job.id, type: jobMQPayloadDto.type, queue: queueName });

      return job as JobDto;
    } catch (error) {
      logError('Failed to send job to queue', { error, jobType: jobMQPayloadDto.type });
      throw error;
    }
  }

  /**
   * Get queue name based on job type
   */
  private getQueueNameForType(type: string): string {
    const queueMap: Record<string, string> = {
      execute_tool: 'execute_tool',
      generate_prompt: 'generate_prompt',
      backup: 'backup',
      extract: 'extract',
      'file-tuning': 'file-tuning',
    };
    return queueMap[type] || 'job-queue';
  }

  /**
   * Save job result into database
   * @param jobResultDto - The job result data
   * @returns Promise<JobResultDro>
   */
  public async saveJobResultIntoJob(jobResultDto: JobResultDto): Promise<JobResultDro> {
    try {
      // Create job result using repository
      const jobResult = await this.jobResultRepository.create({
        jobId: jobResultDto.jobId,
        status: jobResultDto.status,
        result: jobResultDto.result,
        error: jobResultDto.error,
        processingTime: jobResultDto.processingTime,
        metadata: jobResultDto.metadata,
      });

      // Update job status
      await this.jobRepository.update(jobResultDto.jobId, {
        status: jobResultDto.status,
        result: jobResultDto.result,
        error: jobResultDto.error,
        progress: jobResultDto.status === 'completed' ? 100 : undefined,
        finishedAt: jobResultDto.status === 'completed' || jobResultDto.status === 'failed' 
          ? new Date() 
          : undefined,
      });

      logInfo('Job result saved', { jobId: jobResultDto.jobId, status: jobResultDto.status });

      return jobResult;
    } catch (error) {
      logError('Failed to save job result', { error, jobId: jobResultDto.jobId });
      throw error;
    }
  }

  /**
   * Get job results by job ID
   */
  public async getJobResults(jobId: string): Promise<JobResultDro[]> {
    try {
      return await this.jobResultRepository.findByJobId(jobId);
    } catch (error) {
      logError('Failed to get job results', { error, jobId });
      throw error;
    }
  }

  /**
   * Get latest job result
   */
  public async getLatestJobResult(jobId: string): Promise<JobResultDro | null> {
    try {
      return await this.jobResultRepository.findLatestByJobId(jobId);
    } catch (error) {
      logError('Failed to get latest job result', { error, jobId });
      throw error;
    }
  }

  /**
   * Get job result statistics
   */
  public async getJobResultStats(jobId?: string): Promise<any> {
    try {
      return await this.jobResultRepository.getStats(jobId);
    } catch (error) {
      logError('Failed to get job result stats', { error });
      throw error;
    }
  }

  /**
   * Get job details with all relationships
   */
  public async getJobDetail(id: string): Promise<any> {
    try {
      return await this.prisma.job.findUnique({
        where: { id },
        include: {
          conversations: { include: { conversation: true } },
          documents: { include: { document: true } },
          databases: { include: { database: true } },
          user: true,
          results: true,
        },
      });
    } catch (error) {
      logError('Failed to get job details', { error, jobId: id });
      throw error;
    }
  }

  /**
   * Add a new job
   */
  public async addJob(
    type: string,
    payload: any,
    userId?: string,
    description?: string,
    conversationIds?: string[],
    documentIds?: string[],
    databaseIds?: string[]
  ): Promise<any> {
    try {
      if (typeof payload !== 'object' || payload === null) {
        throw new Error('Payload must be an object');
      }

      const jobId = uuidv4();

      const job = await this.prisma.job.create({
        data: {
          id: jobId,
          type,
          status: 'pending',
          payload: JSON.stringify(payload),
          userId,
          description,
          queueName: this.getQueueNameForType(type),
          conversations: conversationIds && conversationIds.length
            ? { create: conversationIds.map((id) => ({ conversationId: id })) }
            : undefined,
          documents: documentIds && documentIds.length
            ? { create: documentIds.map((id) => ({ documentId: id })) }
            : undefined,
          databases: databaseIds && databaseIds.length
            ? { create: databaseIds.map((id) => ({ databaseId: id })) }
            : undefined,
        },
      });

      await this.sendToMQ({
        jobId: job.id,
        type,
        payload,
        userId,
      });

      return job;
    } catch (error) {
      logError('Failed to add job', { error, type });
      throw error;
    }
  }

  /**
   * Update job
   */
  public async updateJob(
    id: string,
    data: Partial<{
      status: string;
      result: any;
      error: string;
      startedAt: Date;
      finishedAt: Date;
      progress: number;
    }>
  ): Promise<any> {
    try {
      if (data.status === 'restart') {
        const originalJob = await this.prisma.job.findUnique({ where: { id } });
        if (!originalJob) {
          throw new Error('Job not found');
        }

        const payload = originalJob.payload ? JSON.parse(originalJob.payload) : {};
        return await this.addJob(
          originalJob.type,
          payload,
          originalJob.userId ?? undefined,
          originalJob.description || undefined
        );
      }

      const updatedJob = await this.prisma.job.update({
        where: { id },
        data: {
          ...data,
          result: data.result ? JSON.stringify(data.result) : undefined,
          finishedAt: data.status === 'completed' || data.status === 'failed' 
            ? new Date() 
            : data.finishedAt,
        },
      });

      return updatedJob;
    } catch (error) {
      logError('Failed to update job', { error, jobId: id });
      throw error;
    }
  }

  /**
   * Delete job
   */
  public async deleteJob(id: string): Promise<void> {
    try {
      await this.prisma.job.delete({ where: { id } });
      logInfo('Job deleted', { jobId: id });
    } catch (error) {
      logError('Failed to delete job', { error, jobId: id });
      throw error;
    }
  }

  /**
   * Get all jobs
   */
  public async getJobs(): Promise<any[]> {
    try {
      return await this.prisma.job.findMany({ 
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          results: true,
        }
      });
    } catch (error) {
      logError('Failed to get jobs', { error });
      throw error;
    }
  }

  /**
   * Get job by ID
   */
  public async getJob(id: string): Promise<any> {
    try {
      return await this.prisma.job.findUnique({ 
        where: { id },
        include: {
          user: true,
          results: true,
        }
      });
    } catch (error) {
      logError('Failed to get job', { error, jobId: id });
      throw error;
    }
  }

  /**
   * Get jobs by status
   */
  public async getJobsByStatus(status: string): Promise<JobDro[]> {
    try {
      return await this.jobRepository.findByStatus(status);
    } catch (error) {
      logError('Failed to get jobs by status', { error, status });
      throw error;
    }
  }

  /**
   * Get jobs by type
   */
  public async getJobsByType(type: string): Promise<JobDro[]> {
    try {
      return await this.jobRepository.findByType(type);
    } catch (error) {
      logError('Failed to get jobs by type', { error, type });
      throw error;
    }
  }

  /**
   * Get job statistics
   */
  public async getJobStats() {
    try {
      return await this.jobRepository.getStats();
    } catch (error) {
      logError('Failed to get job stats', { error });
      throw error;
    }
  }

  /**
   * Ping RabbitMQ connection
   */
  public async pingRabbitMQ(): Promise<boolean> {
    try {
      return this.rabbitMQRepository.isConnected();
    } catch (error) {
      return false;
    }
  }
}

export const jobService = new JobService(
  new JobRepository(),
  new JobResultRepository(),
  new RabbitMQRepository(),
  new PrismaClient()
);