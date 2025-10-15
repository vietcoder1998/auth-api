import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Simple logger function
const logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
};

export const getSSOEntries = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const userId = req.query.userId as string;
    const isActive = req.query.isActive as string;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { url: { contains: search } },
        { key: { contains: search } },
        { deviceIP: { contains: search } },
        { user: { email: { contains: search } } },
        { user: { nickname: { contains: search } } },
      ];
    }

    if (userId) {
      where.userId = userId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [ssoEntries, total] = await Promise.all([
      prisma.sSO.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nickname: true,
            },
          },
          _count: {
            select: {
              loginHistory: true,
            },
          },
        },
      }),
      prisma.sSO.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    logger.info(`Fetched SSO entries`, {
      service: 'auth-api',
      count: ssoEntries.length,
      total,
      page,
      totalPages,
    });

    res.json({
      data: ssoEntries,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    logger.error('Error fetching SSO entries', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to fetch SSO entries' });
  }
};

export const getSSOById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const ssoEntry = await prisma.sSO.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
          },
        },
        loginHistory: {
          orderBy: { loginAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!ssoEntry) {
      return res.status(404).json({ error: 'SSO entry not found' });
    }

    logger.info(`Fetched SSO entry by ID`, {
      service: 'auth-api',
      ssoId: id,
    });

    res.json(ssoEntry);
  } catch (error) {
    logger.error('Error fetching SSO entry by ID', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to fetch SSO entry' });
  }
};

export const createSSO = async (req: Request, res: Response) => {
  try {
    const { url, userId, deviceIP, expiresAt } = req.body;

    // Validate required fields
    if (!url || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: url, userId' 
      });
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Generate unique SSO key
    const key = crypto.randomBytes(32).toString('hex');

    const ssoEntry = await prisma.sSO.create({
      data: {
        url,
        key,
        userId,
        deviceIP: deviceIP || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
          },
        },
      },
    });

    logger.info(`Created new SSO entry`, {
      service: 'auth-api',
      ssoId: ssoEntry.id,
      userId: ssoEntry.userId,
    });

    res.status(201).json(ssoEntry);
  } catch (error) {
    logger.error('Error creating SSO entry', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to create SSO entry' });
  }
};

export const updateSSO = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { url, deviceIP, isActive, expiresAt } = req.body;

    // Check if SSO entry exists
    const existingSSO = await prisma.sSO.findUnique({
      where: { id },
    });

    if (!existingSSO) {
      return res.status(404).json({ error: 'SSO entry not found' });
    }

    const updateData: any = {};
    if (url !== undefined) updateData.url = url;
    if (deviceIP !== undefined) updateData.deviceIP = deviceIP;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const ssoEntry = await prisma.sSO.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
          },
        },
      },
    });

    logger.info(`Updated SSO entry`, {
      service: 'auth-api',
      ssoId: id,
    });

    res.json(ssoEntry);
  } catch (error) {
    logger.error('Error updating SSO entry', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to update SSO entry' });
  }
};

export const deleteSSO = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if SSO entry exists
    const existingSSO = await prisma.sSO.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            loginHistory: true,
          },
        },
      },
    });

    if (!existingSSO) {
      return res.status(404).json({ error: 'SSO entry not found' });
    }

    // Delete associated login history first
    if (existingSSO._count.loginHistory > 0) {
      await prisma.loginHistory.deleteMany({
        where: { ssoId: id },
      });
    }

    await prisma.sSO.delete({
      where: { id },
    });

    logger.info(`Deleted SSO entry`, {
      service: 'auth-api',
      ssoId: id,
    });

    res.json({ message: 'SSO entry deleted successfully' });
  } catch (error) {
    logger.error('Error deleting SSO entry', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to delete SSO entry' });
  }
};

export const regenerateKey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Generate new unique SSO key
    const newKey = crypto.randomBytes(32).toString('hex');

    const ssoEntry = await prisma.sSO.update({
      where: { id },
      data: {
        key: newKey,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
          },
        },
      },
    });

    logger.info(`Regenerated SSO key`, {
      service: 'auth-api',
      ssoId: id,
    });

    res.json(ssoEntry);
  } catch (error) {
    logger.error('Error regenerating SSO key', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to regenerate SSO key' });
  }
};

export const getSSOStats = async (req: Request, res: Response) => {
  try {
    const [totalSSO, activeSSO, expiredSSO, totalLogins] = await Promise.all([
      prisma.sSO.count(),
      prisma.sSO.count({ where: { isActive: true } }),
      prisma.sSO.count({ 
        where: { 
          expiresAt: { 
            lt: new Date() 
          } 
        } 
      }),
      prisma.loginHistory.count(),
    ]);

    const stats = {
      totalSSO,
      activeSSO,
      inactiveSSO: totalSSO - activeSSO,
      expiredSSO,
      totalLogins,
    };

    logger.info(`Fetched SSO stats`, {
      service: 'auth-api',
      stats,
    });

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching SSO stats', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to fetch SSO stats' });
  }
};