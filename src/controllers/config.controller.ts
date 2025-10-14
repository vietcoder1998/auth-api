import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { logger } from '../middlewares/logger.middle';

const prisma = new PrismaClient();

// Helper function to parse config value
function parseConfigValue(value: string): any {
  try {
    return JSON.parse(value);
  } catch {
    return value; // Return as string if not valid JSON
  }
}

// Helper function to prepare config for response
function prepareConfigResponse(config: { id: string; key: string; value: string }) {
  return {
    ...config,
    value: parseConfigValue(config.value)
  };
}

export async function getConfig(req: Request, res: Response) {
  const configs = await prisma.config.findMany();
  const parsedConfigs = configs.map(prepareConfigResponse);
  
  logger.info('Fetched configs', parsedConfigs);
  res.json(parsedConfigs);
}

export async function getConfigByKey(req: Request, res: Response) {
  const { key } = req.params;
  
  try {
    const config = await prisma.config.findUnique({
      where: { key }
    });
    
    if (!config) {
      return res.status(404).json({ error: 'Config not found' });
    }
    
    res.json(prepareConfigResponse(config));
  } catch (error) {
    logger.error('Error fetching config by key:', error);
    res.status(500).json({ error: 'Failed to fetch config' });
  }
}


export async function updateConfig(req: Request, res: Response) {
  const { id, value } = req.body;
  if (!id || value === undefined) {
    return res.status(400).json({ error: 'Missing id or value' });
  }
  
  // Convert value to string if it's an object/array, otherwise keep as string
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  
  const updated = await prisma.config.update({
    where: { id },
    data: { value: stringValue }
  });
  
  res.json(prepareConfigResponse(updated));
}

export async function createConfig(req: Request, res: Response) {
  const { key, value } = req.body;
  if (!key || value === undefined) {
    return res.status(400).json({ error: 'Missing key or value' });
  }
  
  // Convert value to string if it's an object/array, otherwise keep as string
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  
  try {
    const created = await prisma.config.create({
      data: { key, value: stringValue }
    });
    
    res.json(prepareConfigResponse(created));
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Config key already exists.' });
    } else {
      res.status(500).json({ error: 'Failed to create config.' });
    }
  }
}
