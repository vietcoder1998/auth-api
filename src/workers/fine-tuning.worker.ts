import { prisma } from '../setup';
import { BaseWorker } from './base.worker';
import { 
  FineTuningJobPayload, 
  WorkerJobData, 
  WorkerResponse 
} from '../interfaces/worker.interface';

export class FineTuningWorker extends BaseWorker<FineTuningJobPayload> {
  public static readonly fineTuningWorker = new FineTuningWorker()
  public constructor() {
    super(__filename)
  }
  public async processJob(job: WorkerJobData<FineTuningJobPayload>): Promise<void> {
    try {
      console.log(`Starting fine-tuning job ${job.payload.jobId}...`);

      // Simulate fine-tuning logic
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // ✅ Mark as completed
      await this.updateJobStatus(job.payload.jobId, 'completed', {
        result: { message: 'Fine-tuning job completed', payload: job.payload },
      });

      const response: WorkerResponse = {
        success: true,
        data: {
          jobId: job.payload.jobId,
          type: job.payload.type,
          result: 'Fine-tuning job completed',
          payload: job.payload,
        },
      };
      this.send(response);

    } catch (error: any) {
      // ❌ Mark as failed
      await this.updateJobStatus(job.payload.jobId, 'failed', { error: String(error) });

      const response: WorkerResponse = {
        success: false,
        data: { jobId: job.payload.jobId, type: job.payload.type },
        error: String(error),
      };
      this.sendResponse(response);
    } finally {
      await prisma.$disconnect();
    }
  }
}
