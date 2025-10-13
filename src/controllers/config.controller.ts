import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export async function getConfig(req: Request, res: Response) {
  const configs = await prisma.config.findMany();
  res.json(configs);
}

export async function updateConfig(req: Request, res: Response) {
  const { id, value } = req.body;
  if (!id || typeof value !== 'string') {
    return res.status(400).json({ error: 'Missing id or value' });
  }
  const updated = await prisma.config.update({
    where: { id },
    data: { value }
  });
  res.json(updated);
}
