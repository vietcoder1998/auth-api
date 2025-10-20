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

export async function getConfig(req: Request, res: Response) {
  try {
    // Extract query parameters
    const {
      page = '1',
      limit = '10',
      pageSize = limit,
      search = '',
      q = search,
      sortBy = 'key',
      sortOrder = 'asc',
      asMap = 'false',
    } = req.query;

    // If asMap is true, return the old format
    if (asMap === 'true') {
      const configs = await prisma.config.findMany();
      const configMap: Record<string, any> = {};
      configs.forEach((config) => {
        configMap[config.key] = parseConfigValue(config.value);
      });
      logger.info('Fetched configs as map', configMap);
      return res.json(configMap);
    }

    // Parse pagination parameters
    const currentPage = Math.max(1, parseInt(page as string, 10));
    const currentLimit = Math.max(1, Math.min(100, parseInt(pageSize as string, 10)));
    const skip = (currentPage - 1) * currentLimit;

    // Build where clause for search
    const whereClause: any = {};

    // Search across key and value fields
    if (q && typeof q === 'string' && q.trim()) {
      const searchTerm = q.trim();
      whereClause.OR = [{ key: { contains: searchTerm } }, { value: { contains: searchTerm } }];
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'key') {
      orderBy.key = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else {
      orderBy.key = 'asc'; // Default
    }

    // Get total count for pagination
    const total = await prisma.config.count({ where: whereClause });

    // Get configs with pagination
    const configs = await prisma.config.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: currentLimit,
    });

    // Parse values
    const parsedConfigs = configs.map((config) => ({
      ...config,
      parsedValue: parseConfigValue(config.value),
    }));

    logger.info('Fetched configs with pagination', {
      count: configs.length,
      total,
      page: currentPage,
    });

    res.json({
      data: parsedConfigs,
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit),
    });
  } catch (error) {
    logger.error('Error fetching configs:', error);
    res.status(500).json({ error: 'Failed to fetch configs' });
  }
}

export async function getConfigByKey(req: Request, res: Response) {
  const { key } = req.params;

  try {
    const config = await prisma.config.findUnique({
      where: { key },
    });

    if (!config) {
      return res.status(404).json({ error: 'Config not found' });
    }

    // Return just the pure value
    res.json(parseConfigValue(config.value));
  } catch (error) {
    logger.error('Error fetching config by key:', error);
    res.status(500).json({ error: 'Failed to fetch config' });
  }
}

export async function updateConfig(req: Request, res: Response) {
  const { key, value } = req.body;
  if (!key || value === undefined) {
    return res.status(400).json({ error: 'Missing key or value' });
  }

  try {
    // Convert value to string if it's an object/array, otherwise keep as string
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    const updated = await prisma.config.update({
      where: { key },
      data: { value: stringValue },
    });

    // Return just the pure value
    res.json(parseConfigValue(updated.value));
  } catch (error) {
    logger.error('Error updating config:', error);
    res.status(500).json({ error: 'Failed to update config' });
  }
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
      data: { key, value: stringValue },
    });

    // Return just the pure value
    res.json(parseConfigValue(created.value));
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Config key already exists.' });
    } else {
      res.status(500).json({ error: 'Failed to create config.' });
    }
  }
}

export async function deleteConfig(req: Request, res: Response) {
  const { key } = req.params;

  try {
    await prisma.config.delete({
      where: { key },
    });

    res.json({ success: true, message: 'Config deleted successfully' });
  } catch (error) {
    logger.error('Error deleting config:', error);
    res.status(500).json({ error: 'Failed to delete config' });
  }
}
