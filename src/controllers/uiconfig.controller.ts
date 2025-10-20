import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
const prisma = new PrismaClient();

// List all UI configs
export async function listUiConfigs(req: Request, res: Response) {
  const { role } = req.query;
  const where = role ? { role: String(role) } : {};
  const configs = await prisma.uiConfig.findMany({ where });
  res.json({ data: configs });
}

// Get UI config by id
export async function getUiConfig(req: Request, res: Response) {
  const { id } = req.params;
  const config = await prisma.uiConfig.findUnique({ where: { id } });
  if (!config) return res.status(404).json({ error: 'Not found' });
  res.json({ data: config });
}

// Create UI config
export async function createUiConfig(req: Request, res: Response) {
  const { name, value, role } = req.body;
  const config = await prisma.uiConfig.create({
    data: { name, value: JSON.stringify(value), role },
  });
  res.status(201).json({ data: config });
}

// Update UI config
export async function updateUiConfig(req: Request, res: Response) {
  const { id } = req.params;
  const { name, value, role } = req.body;
  const config = await prisma.uiConfig.update({
    where: { id },
    data: { name, value: JSON.stringify(value), role },
  });
  res.json({ data: config });
}

// Delete UI config
export async function deleteUiConfig(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.uiConfig.delete({ where: { id } });
  res.json({ success: true });
}
