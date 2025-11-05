import { jobController } from '../controllers/job.controller';
import { JobDro, JobDto, JobModel } from '../interfaces';
import { BaseRouter } from './index';

export class JobRoutes extends BaseRouter<JobModel, JobDto, JobDro> {
  constructor() {
    super('/jobs');
    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    // Public routes
    this.routes.get('/ping', jobController.pingRabbitMQ.bind(jobController));

    // Job CRUD operations
    this.routes.post('/', jobController.createJob.bind(jobController));
    this.routes.get('/', jobController.listJobs.bind(jobController));
    this.routes.get('/stats', jobController.getJobStats.bind(jobController));
    this.routes.get('/:id', jobController.getJob.bind(jobController));
    this.routes.get('/:id/detail', jobController.getJobDetail.bind(jobController));
    this.routes.put('/:id', jobController.updateJob.bind(jobController));
    this.routes.delete('/:id', jobController.deleteJob.bind(jobController));

    // Job actions
    this.routes.post('/:id/start', jobController.startJob.bind(jobController));
    this.routes.post('/:id/retry', jobController.retryJob.bind(jobController));
    this.routes.post(
      '/documents/:id/extract',
      jobController.startExtractJobForDocument.bind(jobController),
    );

    // Job results
    this.routes.get('/:id/results', jobController.getJobResults.bind(jobController));
    this.routes.get('/:id/results/latest', jobController.getLatestJobResult.bind(jobController));
  }
}

export const jobRoutes = new JobRoutes();
export default jobRoutes;
