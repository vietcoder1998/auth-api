import { Router } from 'express';
import * as jobController from '../controllers/job.controller';

const router = Router();

router.post('/', jobController.createJob);
router.get('/', jobController.listJobs);
router.get('/:id', jobController.getJob);
router.get('/:id/detail', jobController.getJobDetail);
router.delete('/:id', jobController.deleteJob);
router.post('/:id/start', jobController.startJob);

export default router;
