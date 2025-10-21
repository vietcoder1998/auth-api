export async function getJobDetail(req: Request, res: Response) {
  const job = await jobService.getJobDetail(req.params.id);
  res.json({ success: true, data: job });
}
import { Request, Response } from 'express';
import * as jobService from '../services/job.service';

export async function createJob(req: Request, res: Response) {
  const { type, payload, description } = req.body;
  const userId = req.user?.id; // adjust if you use authentication
  const job = await jobService.addJob(type, payload, userId, description);
  res.json({ success: true, data: job });
}

export async function listJobs(req: Request, res: Response) {
  const jobs = await jobService.getJobs();
  res.json({ success: true, data: jobs });
}

export async function getJob(req: Request, res: Response) {
  const job = await jobService.getJob(req.params.id);
  res.json({ success: true, data: job });
}

export async function deleteJob(req: Request, res: Response) {
  await jobService.deleteJob(req.params.id);
  res.json({ success: true });
}