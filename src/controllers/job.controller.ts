
import { Request, Response } from 'express';
import * as jobService from '../services/job.service';

export async function startExtractJobForDocument(req: Request, res: Response) {
  const documentId = req.params.id;
  const userId = req.user?.id;
  // You may want to fetch document details here if needed
  const job = await jobService.addJob(
    'extract',
    { documentId },
    userId,
    `Extract document ${documentId}`,
  );
  res.json({ success: true, data: job });
}
export async function getJobDetail(req: Request, res: Response) {
  const job = await jobService.getJobDetail(req.params.id);
  res.json({ success: true, data: job });
}
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

export async function startJob(req: Request, res: Response) {
  const jobId = req.params.id;
  try {
    // Update job status to 'pending' or 'running'
    const job = await jobService.updateJob(jobId, { status: 'pending', startedAt: new Date() });
    // Trigger job processing by sending to queue (re-enqueue)
    const ch = await jobService.getChannel();
    if (ch) {
      ch.sendToQueue('job-queue', Buffer.from(JSON.stringify({ jobId: job.id, type: job.type, payload: JSON.parse(job.payload || '{}') })), {
        persistent: true,
      });
    }
    res.json({ success: true, message: `Job ${jobId} started.` });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
}