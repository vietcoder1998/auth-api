import { JobResultDro, JobResultDto } from '../interfaces/job-result.interface';
import { JobDto, JobModel, JobMQPayloadDto } from '../interfaces/job.interface';
import { logError, logInfo } from '../middlewares/logger.middle';
import { JobResultRepository } from '../repositories/job-result.repository';
import { JobRepository } from '../repositories/job.repository';
import { RabbitMQRepository } from '../repositories/rabbitmq.repository';
import { JobDro, JobUpdateDto } from './../interfaces/job.interface';
import { BaseService } from './base.service';

export class JobService extends BaseService<JobModel, JobDto, JobDro> {
  private readonly jobRepository: JobRepository;
  private readonly jobResultRepository: JobResultRepository;
  private readonly rabbitMQRepository: RabbitMQRepository;

  constructor() {
    super();
    this.jobRepository = jobRepository;
    this.jobResultRepository = jobResultRepository;
    this.rabbitMQRepository = rabbitMQRepository;
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
  public async sendToMQ(jobMQPayloadDto: JobMQPayloadDto): Promise<boolean> {
    try {
      const queueName = this.getQueueNameForType(jobMQPayloadDto.type);
      const rabbitMqQueueResult = await this.rabbitMQRepository.publishToQueue(
        queueName,
        {
          jobId: jobMQPayloadDto.jobId,
          type: jobMQPayloadDto.type,
          payload: jobMQPayloadDto.payload,
        },
        {
          persistent: true,
          priority: jobMQPayloadDto.priority || 0,
        },
      );

      logInfo('Job sent to queue', {
        jobId: jobMQPayloadDto.jobId,
        type: jobMQPayloadDto.type,
        queue: queueName,
      });

      return rabbitMqQueueResult as boolean;
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
        finishedAt:
          jobResultDto.status === 'completed' || jobResultDto.status === 'failed'
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
  public async getJobDetail(id: string): Promise<JobDro | null> {
    try {
      const job: JobDro | null = await this.jobRepository.findById(id);
      return job;
    } catch (error) {
      logError('Failed to get job details', { error, jobId: id });
      throw error;
    }
  }

  /**
   * Update job
   */
  public async updateJob(id: string, data: Partial<JobUpdateDto>): Promise<JobDro> {
    try {
      const jobIdToUpdate: string = id;
      const updateJobDto: Partial<JobDto> = {
        ...data,
        finishedAt:
          data.status === 'completed' || data.status === 'failed' ? new Date() : data.finishedAt,
        payload: typeof data.payload === 'object' ? JSON.stringify(data.payload) : data.payload,
      };
      const updatedJob: JobDro = await this.jobRepository.upsert(
        { id: jobIdToUpdate },
        updateJobDto as JobUpdateDto,
        updateJobDto as Partial<JobUpdateDto>,
      );
      const jobMqPayload: JobMQPayloadDto = {
        jobId: jobIdToUpdate,
        type: updatedJob.type,
        payload:
          typeof updatedJob.payload === 'string'
            ? JSON.parse(updatedJob.payload)
            : (updatedJob.payload ?? {}), // Ensure payload is always an object
      };
      const isSendedToMq: boolean = await this.sendToMQ(jobMqPayload);
      const updateJobDro: JobDro = {
        ...updatedJob,
        isQueued: isSendedToMq,
      };

      return updateJobDro;
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
      await this.jobRepository.delete(id);
      logInfo('Job deleted', { jobId: id });
    } catch (error) {
      logError('Failed to delete job', { error, jobId: id });
      throw error;
    }
  }
  public async getJobs(): Promise<any[]> {
    try {
      return await this.jobRepository.findAllWithRelations();
    } catch (error) {
      logError('Failed to get jobs - possible database schema mismatch', { error });
      // Return empty array instead of throwing to prevent startup failure
      return [];
    }
  }

  /**
   * Get job by ID
   */
  public async getJob(id: string): Promise<any> {
    try {
      return await this.jobRepository.findByIdWithRelations(id);
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
   * Retry a failed job
   */
  public async retryJob(id: string): Promise<any> {
    try {
      // Get the current job
      const job = await this.jobRepository.findByIdWithUser(id);

      if (!job) {
        throw new Error('Job not found');
      }

      // Check if job can be retried
      if (job.status !== 'failed') {
        throw new Error(`Job cannot be retried. Current status: ${job.status}`);
      }

      // Check retry count
      const currentRetries = job.retries || 0;
      const maxRetries = job.maxRetries || 3;

      if (currentRetries >= maxRetries) {
        throw new Error(`Maximum retry attempts (${maxRetries}) reached for this job`);
      }

      // Parse payload
      const payload = job.payload ? job.payload : {};

      // Increment retry count and reset job status
      const updatedJob = await this.jobRepository.update(job.id, {
        status: 'pending',
        retries: currentRetries + 1,
        error: null,
        result: undefined,
        startedAt: null,
        finishedAt: null,
        progress: 0,
        updatedAt: new Date(),
      });

      // Resend to queue
      await this.sendToMQ({
        jobId: job.id,
        type: job.type,
        payload,
        userId: job.userId || undefined,
        priority: job.priority || 0,
      });

      logInfo('Job retry initiated', {
        jobId: id,
        retryCount: currentRetries + 1,
        maxRetries,
      });

      return updatedJob;
    } catch (error) {
      logError('Failed to retry job', { error, jobId: id });
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

export const jobRepository = new JobRepository();
export const jobResultRepository = new JobResultRepository();
export const rabbitMQRepository = new RabbitMQRepository();

export const jobService = new JobService();
