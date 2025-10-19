import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function healthCheck(req: Request, res: Response) {
  const status: Record<string, any> = {};
  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    status.database = { status: 'ok' };
  } catch (err) {
    status.database = { status: 'error', error: (err as Error)?.message || String(err) };
  }

  // Add more service checks here (e.g., cache, mail, external APIs)
  // Example: status.cache = { status: 'ok' };

  // Uptime
  status.uptime = process.uptime();
  status.timestamp = new Date().toISOString();

  res.json({ success: true, status });
}
