
import { Request, Response } from 'express';
import { jobQueue } from '../services/job.service';

export async function startExtractJobForDocument(req: Request, res: Response): Promise<void> {
  const documentId = req.params.id;
  const userId = req.user?.id;
  // You may want to fetch document details here if needed
  const job = await jobQueue.addJob(
    'extract',
    { documentId },
    userId,
    `Extract document ${documentId}`,
  );
  res.json({ success: true, data: job });
}

export async function getJobDetail(req: Request, res: Response): Promise<void> {
  const job = await jobQueue.getJobDetail(req.params.id);
  res.json({ success: true, data: job });
}

export async function createJob(req: Request, res: Response): Promise<void> {
  const { type, payload, description } = req.body;
  const userId = req.user?.id; // adjust if you use authentication
  const job = await jobQueue.addJob(type, payload, userId, description);
  res.json({ success: true, data: job });
}

export async function listJobs(req: Request, res: Response): Promise<void> {
  const jobs = await jobQueue.getJobs();
  res.json({ success: true, data: jobs });
}

export async function getJob(req: Request, res: Response): Promise<void> {
  const job = await jobQueue.getJob(req.params.id);
  res.json({ success: true, data: job });
}

export async function deleteJob(req: Request, res: Response): Promise<void> {
  await jobQueue.deleteJob(req.params.id);
  res.json({ success: true });
}

export async function startJob(req: Request, res: Response): Promise<void> {
  const jobId = req.params.id;
  try {
    // Update job status to 'pending' or 'running'
    const job = await jobQueue.updateJob(jobId, { status: 'pending', startedAt: new Date() });
    // Trigger job processing by sending to queue (re-enqueue)
    await jobQueue.sendToQueue(job);
    res.json({ success: true, message: `Job ${jobId} started.` });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
}