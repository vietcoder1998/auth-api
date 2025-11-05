import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { JobModel, JobDto, JobDro } from '../interfaces/job.interface';
import { JobService } from '../services/job.service';
import { jobService } from '../services';

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
      
      res.json({ success: true, data: job });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Get job detail with relationships
   */
  async getJobDetail(req: Request, res: Response): Promise<void> {
    try {
      const job = await this.jobService.getJobDetail(req.params.id);
      
      if (!job) {
        res.status(404).json({ success: false, error: 'Job not found' });
        return;
      }
      
      res.json({ success: true, data: job });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
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
        res.status(400).json({ success: false, error: 'Job type is required' });
        return;
      }
      
      if (!payload) {
        res.status(400).json({ success: false, error: 'Job payload is required' });
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
      
      res.status(201).json({ success: true, data: job });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * List all jobs
   */
  async listJobs(req: Request, res: Response): Promise<void> {
    try {
      const { status, type } = req.query;
      
      let jobs;
      
      if (status) {
        jobs = await this.jobService.getJobsByStatus(String(status));
      } else if (type) {
        jobs = await this.jobService.getJobsByType(String(type));
      } else {
        jobs = await this.jobService.getJobs();
      }
      
      res.json({ success: true, data: jobs });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Get a single job by ID
   */
  async getJob(req: Request, res: Response): Promise<void> {
    try {
      const job = await this.jobService.getJob(req.params.id);
      
      if (!job) {
        res.status(404).json({ success: false, error: 'Job not found' });
        return;
      }
      
      res.json({ success: true, data: job });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
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
      
      res.json({ success: true, data: job });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Delete a job
   */
  async deleteJob(req: Request, res: Response): Promise<void> {
    try {
      await this.jobService.deleteJob(req.params.id);
      res.json({ success: true, message: 'Job deleted successfully' });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Start/restart a job
   */
  async startJob(req: Request, res: Response): Promise<void> {
    try {
      const jobId = req.params.id;
      
      // Update job status to restart
      const job = await this.jobService.updateJob(jobId, { 
        status: 'restart'
      });
      
      res.json({ 
        success: true, 
        message: `Job ${jobId} restarted successfully`,
        data: job 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(req: Request, res: Response): Promise<void> {
    try {
      const jobId = req.params.id;
      
      const job = await this.jobService.retryJob(jobId);
      
      res.json({ 
        success: true, 
        message: `Job ${jobId} queued for retry`,
        data: job 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Get job statistics
   */
  async getJobStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.jobService.getJobStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Get job results
   */
  async getJobResults(req: Request, res: Response): Promise<void> {
    try {
      const jobId = req.params.id;
      const results = await this.jobService.getJobResults(jobId);
      res.json({ success: true, data: results });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
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
        res.status(404).json({ success: false, error: 'No results found for this job' });
        return;
      }
      
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Ping RabbitMQ connection
   */
  async pingRabbitMQ(req: Request, res: Response): Promise<void> {
    try {
      const isConnected = await this.jobService.pingRabbitMQ();
      res.json({ 
        success: true, 
        connected: isConnected,
        message: isConnected ? 'RabbitMQ is connected' : 'RabbitMQ is not connected'
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        connected: false,
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }
}

// Export singleton instance
export const jobController = new JobController(jobService);