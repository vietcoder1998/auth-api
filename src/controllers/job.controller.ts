import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { JobModel, JobDto, JobDro } from '../interfaces/job.interface';
import { JobService } from '../services/job.service';
import { jobService, jobRepository } from '../services';
import { workerService } from '../services/worker.service';

export class JobController extends BaseController<JobModel, JobDto, JobDro> {
  private jobService: JobService;

  constructor(jobService: JobService) {
    super(jobService);
    this.jobService = jobService;
  }

  /**
   * Start extract job for a document
   */
  async startExtractJobForDocument(req: Request, res: Response): Promise<void> {
    try {
      const documentId = req.params.id;
      const userId = req.user?.id;
      
      const job = await this.jobService.addJob(
        'extract',
        { documentId },
        userId,
        `Extract document ${documentId}`,
      );
      
      this.sendSuccess(res, job);
    } catch (error) {
      this.handleError(res, error instanceof Error ? error.message : String(error), 500);
    }
  }

  /**
   * Get job detail with relationships
   */
  async getJobDetail(req: Request, res: Response): Promise<void> {
    try {
      const job = await jobRepository.findById(req.params.id);
      
      if (!job) {
        this.handleError(res, 'Job not found', 404);
        return;
      }
      
      this.sendSuccess(res, job);
    } catch (error) {
      this.handleError(res, error instanceof Error ? error.message : String(error), 500);
    }
  }

  /**
   * Create a new job
   */
  async createJob(req: Request, res: Response): Promise<void> {
    try {
      const { type, payload, description, conversationIds, documentIds, databaseIds } = req.body;
      const userId = req.user?.id;
      
      if (!type) {
        this.handleError(res, 'Job type is required', 400);
        return;
      }
      
      if (!payload) {
        this.handleError(res, 'Job payload is required', 400);
        return;
      }
      
      const job = await this.jobService.addJob(
        type, 
        payload, 
        userId, 
        description,
        conversationIds,
        documentIds,
        databaseIds
      );
      
      this.sendSuccess(res, job);
    } catch (error) {
      this.handleError(res, error instanceof Error ? error.message : String(error), 500);
    }
  }

  /**
   * List all jobs
   */
  async listJobs(req: Request, res: Response): Promise<void> {
    try {
      const { status, type } = req.query;
      
      let jobs: JobDro[];
      
      switch (true) {
        case !!status:
          jobs = await jobRepository.findByStatus(String(status));
          break;
        case !!type:
          jobs = await jobRepository.findByType(String(type));
          break;
        default:
          jobs = await jobRepository.findAllWithRelations();
          break;
      }
      
      this.sendSuccess(res, jobs);
    } catch (error) {
      this.handleError(res, error instanceof Error ? error.message : String(error), 500);
    }
  }

  /**
   * Get a single job by ID
   */
  async getJob(req: Request, res: Response): Promise<void> {
    try {
      const job = await jobRepository.findByIdWithRelations(req.params.id);
      
      if (!job) {
        this.handleError(res, 'Job not found', 404);
        return;
      }
      
      this.sendSuccess(res, job);
    } catch (error) {
      this.handleError(res, error instanceof Error ? error.message : String(error), 500);
    }
  }

  /**
   * Update a job
   */
  async updateJob(req: Request, res: Response): Promise<void> {
    try {
      const { status, result, error: jobError, progress } = req.body;
      
      const job = await this.jobService.updateJob(req.params.id, {
        status,
        result,
        error: jobError,
        progress,
      });
      
      this.sendSuccess(res, job);
    } catch (error) {
      this.handleError(res, error instanceof Error ? error.message : String(error), 500);
    }
  }

  /**
   * Delete a job
   */
  async deleteJob(req: Request, res: Response): Promise<void> {
    try {
      await jobRepository.delete(req.params.id);
      this.sendSuccess(res, null, 'Job deleted successfully');
    } catch (error) {
      this.handleError(res, error instanceof Error ? error.message : String(error), 500);
    }
  }

  /**
   * Start/restart a job
   */
  async startJob(req: Request, res: Response): Promise<void> {
    try {
      const jobId = req.params.id;
      const { action = 'start' } = req.body; // 'start' or 'restart'
      
      // Get the existing job
      const existingJob = await jobRepository.findByIdWithRelations(jobId);
      if (!existingJob) {
        this.handleError(res, 'Job not found', 404);
        return;
      }

      if (action === 'restart') {
        // Stop existing worker if running
        await workerService.stopJobWorker(jobId);
        
        // Reset job status and restart
        const job = await this.jobService.updateJob(jobId, { 
          status: 'pending',
          startedAt: null,
          finishedAt: null,
          progress: 0,
          error: null
        });
        
        // Start new worker for this job
        await workerService.startJobWorker(jobId, existingJob.type, existingJob.payload);
        
        this.sendSuccess(res, job, `Job ${jobId} restarted successfully`);
      } else {
        // Start job - create new worker
        if (existingJob.status === 'running') {
          this.handleError(res, 'Job is already running', 400);
          return;
        }
        
        // Update job status to pending
        const job = await this.jobService.updateJob(jobId, { 
          status: 'pending'
        });
        
        // Start new worker for this job
        await workerService.startJobWorker(jobId, existingJob.type, existingJob.payload);
        
        this.sendSuccess(res, job, `Job ${jobId} started successfully`);
      }
    } catch (error) {
      this.handleError(res, error instanceof Error ? error.message : String(error), 500);
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(req: Request, res: Response): Promise<void> {
    try {
      const jobId = req.params.id;
      
      const job = await this.jobService.retryJob(jobId);
      
      this.sendSuccess(res, job, `Job ${jobId} queued for retry`);
    } catch (error) {
      this.handleError(res, error instanceof Error ? error.message : String(error), 500);
    }
  }

  /**
   * Get job statistics
   */
  async getJobStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await jobRepository.getStats();
      this.sendSuccess(res, stats);
    } catch (error) {
      this.handleError(res, error instanceof Error ? error.message : String(error), 500);
    }
  }

  /**
   * Get job results
   */
  async getJobResults(req: Request, res: Response): Promise<void> {
    try {
      const jobId = req.params.id;
      const results = await this.jobService.getJobResults(jobId);
      this.sendSuccess(res, results);
    } catch (error) {
      this.handleError(res, error instanceof Error ? error.message : String(error), 500);
    }
  }

  /**
   * Get latest job result
   */
  async getLatestJobResult(req: Request, res: Response): Promise<void> {
    try {
      const jobId = req.params.id;
      const result = await this.jobService.getLatestJobResult(jobId);
      
      if (!result) {
        this.handleError(res, 'No results found for this job', 404);
        return;
      }
      
      this.sendSuccess(res, result);
    } catch (error) {
      this.handleError(res, error instanceof Error ? error.message : String(error), 500);
    }
  }

  /**
   * Ping RabbitMQ connection
   */
  async pingRabbitMQ(req: Request, res: Response): Promise<void> {
    try {
      const isConnected = await this.jobService.pingRabbitMQ();
      this.sendSuccess(
        res, 
        { connected: isConnected },
        isConnected ? 'RabbitMQ is connected' : 'RabbitMQ is not connected'
      );
    } catch (error) {
      this.handleError(res, error instanceof Error ? error.message : String(error), 500);
    }
  }
}

// Export singleton instance
export const jobController = new JobController(jobService);