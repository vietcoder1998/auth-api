import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { logger } from '../middlewares/logger.middle';

const prisma = new PrismaClient();


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
        { url: { contains: search, mode: 'insensitive' } },
        { key: { contains: search, mode: 'insensitive' } },
        { deviceIP: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { nickname: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (userId) {
      where.userId = userId;
    }

    if (isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    // Debug logging to see what we're querying
    console.log('Debug SSO Query:', {
      where: JSON.stringify(where, null, 2),
      page,
      limit,
      skip
    });

    // First check if we have any SSO entries at all
    const totalEntries = await prisma.sSO.count();
    console.log('Debug: Total SSO entries in database:', totalEntries);

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

    console.log('Debug SSO Results:', {
      foundEntries: ssoEntries.length,
      totalWithFilter: total,
      totalInDB: totalEntries,
      sampleEntry: ssoEntries[0] || 'No entries found'
    });

    logger.info(`Fetched SSO entries`, {
      service: 'auth-api',
      count: ssoEntries.length,
      total,
      page,
      totalPages,
    });

    res.json({
      data: ssoEntries || [],
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

    if (!id) {
      return res.status(400).json({ error: 'SSO ID is required' });
    }

    console.log('Debug: Fetching SSO by ID:', id);

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
          select: {
            id: true,
            deviceIP: true,
            userAgent: true,
            loginAt: true,
            logoutAt: true,
            status: true,
            location: true,
          },
        },
      },
    });

    console.log('Debug: SSO entry found:', ssoEntry ? 'Yes' : 'No');

    if (!ssoEntry) {
      return res.status(404).json({ error: 'SSO entry not found' });
    }

    logger.info(`Fetched SSO entry by ID`, {
      service: 'auth-api',
      ssoId: id,
      hasUser: !!ssoEntry.user,
      loginHistoryCount: ssoEntry.loginHistory.length,
    });

    res.json(ssoEntry);
  } catch (error) {
    console.error('Debug: Error fetching SSO by ID:', error);
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

    if (!id) {
      return res.status(400).json({ error: 'SSO ID is required' });
    }

    // Check if SSO entry exists first
    const existingSSO = await prisma.sSO.findUnique({
      where: { id },
    });

    if (!existingSSO) {
      return res.status(404).json({ error: 'SSO entry not found' });
    }

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
      oldKey: existingSSO.key.substring(0, 8) + '...',
      newKey: newKey.substring(0, 8) + '...',
    });

    res.json(ssoEntry);
  } catch (error: any) {
    console.error('Debug: Error regenerating SSO key:', error);
    logger.error('Error regenerating SSO key', { error, service: 'auth-api' });
    
    // Handle specific Prisma errors
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'SSO entry not found' });
    }
    
    res.status(500).json({ error: 'Failed to regenerate SSO key' });
  }
};

export const getSSOStats = async (req: Request, res: Response) => {
  try {
    const [totalSSO, activeSSO, expiredSSO, totalLogins, ssoLogins] = await Promise.all([
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
      prisma.loginHistory.count({ where: { NOT: { ssoId: null } } }),
    ]);

    const stats = {
      totalSSO: totalSSO || 0,
      activeSSO: activeSSO || 0,
      inactiveSSO: (totalSSO || 0) - (activeSSO || 0),
      expiredSSO: expiredSSO || 0,
      totalLogins: totalLogins || 0,
      ssoLogins: ssoLogins || 0,
      directLogins: (totalLogins || 0) - (ssoLogins || 0),
    };

    console.log('Debug SSO Stats:', stats);

    logger.info(`Fetched SSO stats`, {
      service: 'auth-api',
      stats,
    });

    res.json(stats);
  } catch (error) {
    console.error('Debug: Error fetching SSO stats:', error);
    logger.error('Error fetching SSO stats', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to fetch SSO stats' });
  }
};