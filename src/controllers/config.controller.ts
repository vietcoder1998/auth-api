import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { logger } from '../middlewares/logger.middle';

const prisma = new PrismaClient();

export async function getConfig(req: Request, res: Response) {
  const configs = await prisma.config.findMany();
  logger.info('Fetched configs', configs);
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

export async function createConfig(req: Request, res: Response) {
  const { key, value } = req.body;
  if (!key || typeof value !== 'string') {
    return res.status(400).json({ error: 'Missing key or value' });
  }
  try {
    const created = await prisma.config.create({
      data: { key, value }
    });
    res.json(created);
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Config key already exists.' });
    } else {
      res.status(500).json({ error: 'Failed to create config.' });
    }
  }
}
