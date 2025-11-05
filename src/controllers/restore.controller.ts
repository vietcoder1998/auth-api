import { Request, Response } from 'express';
import { JobService } from '../services/job.service';
import { RestoreJobPayload } from '../interfaces/worker.interface';

export class RestoreController {
  private jobService: JobService;

  constructor() {
    this.jobService = new JobService();
  }

  /**
   * Create a new restore job
   * POST /api/restore
   */
  public createRestoreJob = async (req: Request, res: Response) => {
    try {
      const { backupUrl, database, tables, options }: RestoreJobPayload = req.body;

      // Validate required fields
      if (!backupUrl) {
        return res.status(400).json({
          success: false,
          error: 'Backup URL is required'
        });
      }

      // Validate URL format
      if (!this.isValidUrl(backupUrl)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid backup URL format'
        });
      }

      // Create restore job
      const restoreJob = await this.jobService.create({
        type: 'restore',
        payload: {
          backupUrl,
          database,
          tables,
          options: {
            overwrite: options?.overwrite || false,
            validate: options?.validate !== false, // Default to true
            batchSize: options?.batchSize || 100,
            timeout: options?.timeout || 300000,
            retryAttempts: options?.retryAttempts || 2,
            skipErrors: options?.skipErrors || false,
            compression: options?.compression || 'none',
            encryption: options?.encryption
          }
        },
        priority: 2, // High priority for restore jobs
        maxRetries: options?.retryAttempts || 2,
        timeout: options?.timeout || 300000,
        description: `Restore database from ${backupUrl}`,
        userId: req.user?.id || null
      });

      res.status(201).json({
        success: true,
        data: {
          jobId: restoreJob.id,
          status: restoreJob.status,
          message: 'Restore job created successfully',
          estimatedDuration: '5-30 minutes',
          backupUrl: backupUrl
        }
      });

    } catch (error) {
      console.error('Error creating restore job:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create restore job',
        details: String(error)
      });
    }
  };

  /**
   * Get restore job status
   * GET /api/restore/:jobId
   */
  public getRestoreJobStatus = async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;

      const job = await this.jobService.getJobDetail(jobId);
      
      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Restore job not found'
        });
      }

      if (job.type !== 'restore') {
        return res.status(400).json({
          success: false,
          error: 'Invalid job type'
        });
      }

      // Parse result if available
      let parsedResult = null;
      if (job.result) {
        try {
          parsedResult = typeof job.result === 'string' 
            ? JSON.parse(job.result) 
            : job.result;
        } catch (e) {
          parsedResult = { message: job.result };
        }
      }

      res.json({
        success: true,
        data: {
          jobId: job.id,
          status: job.status,
          progress: job.progress,
          startedAt: job.startedAt,
          finishedAt: job.finishedAt,
          duration: job.finishedAt && job.startedAt 
            ? `${job.finishedAt.getTime() - job.startedAt.getTime()}ms`
            : null,
          result: parsedResult,
          error: job.error,
          retries: job.retries,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt
        }
      });

    } catch (error) {
      console.error('Error getting restore job status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get job status',
        details: String(error)
      });
    }
  };

  /**
   * List restore jobs with filtering
   * GET /api/restore
   */
  public listRestoreJobs = async (req: Request, res: Response) => {
    try {
      const { 
        status, 
        limit = 20, 
        offset = 0, 
        userId 
      } = req.query;

      const filters: any = { type: 'restore' };
      
      if (status) {
        filters.status = status;
      }
      
      if (userId) {
        filters.userId = userId;
      }

      // Get all jobs and filter by type and status
      const allJobs = await this.jobService.getJobs();
      const restoreJobs = allJobs.filter(job => job.type === 'restore');
      
      // Apply status filter if provided
      const filteredJobs = status ? restoreJobs.filter(job => job.status === status) : restoreJobs;
      
      // Apply pagination
      const totalCount = filteredJobs.length;
      const jobs = filteredJobs
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(Number(offset), Number(offset) + Number(limit));

      res.json({
        success: true,
        data: {
          jobs: jobs.map(job => {
            const payload = typeof job.payload === 'string' ? JSON.parse(job.payload) : job.payload;
            return {
              jobId: job.id,
              status: job.status,
              progress: job.progress,
              backupUrl: payload?.backupUrl,
              database: payload?.database,
              startedAt: job.startedAt,
              finishedAt: job.finishedAt,
              createdAt: job.createdAt,
              error: job.error
            };
          }),
          pagination: {
            total: totalCount,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: Number(offset) + Number(limit) < totalCount
          }
        }
      });

    } catch (error) {
      console.error('Error listing restore jobs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list restore jobs',
        details: String(error)
      });
    }
  };

  /**
   * Cancel a restore job
   * DELETE /api/restore/:jobId
   */
  public cancelRestoreJob = async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;

      const job = await this.jobService.getJobDetail(jobId);
      
      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Restore job not found'
        });
      }

      if (job.type !== 'restore') {
        return res.status(400).json({
          success: false,
          error: 'Invalid job type'
        });
      }

      if (job.status === 'completed' || job.status === 'failed') {
        return res.status(400).json({
          success: false,
          error: `Cannot cancel ${job.status} job`
        });
      }

      // Update job status to cancelled
      const updatedJob = await this.jobService.updateJob(jobId, {
        status: 'cancelled',
        finishedAt: new Date(),
        error: 'Job cancelled by user'
      });

      if (!updatedJob) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update job status'
        });
      }

      res.json({
        success: true,
        data: {
          jobId: updatedJob.id,
          status: updatedJob.status,
          message: 'Restore job cancelled successfully'
        }
      });

    } catch (error) {
      console.error('Error cancelling restore job:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel restore job',
        details: String(error)
      });
    }
  };

  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:', 'ftp:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }
}

export const restoreController = new RestoreController();