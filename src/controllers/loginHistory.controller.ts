import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simple logger function
const logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
};

export const getLoginHistory = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const userId = req.query.userId as string;
    const ssoId = req.query.ssoId as string;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { deviceIP: { contains: search } },
        { userAgent: { contains: search } },
        { location: { contains: search } },
        { user: { email: { contains: search } } },
        { user: { nickname: { contains: search } } },
      ];
    }

    if (userId) {
      where.userId = userId;
    }

    if (ssoId) {
      where.ssoId = ssoId;
    }

    if (status) {
      where.status = status;
    }

    const [loginHistory, total] = await Promise.all([
      prisma.loginHistory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { loginAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nickname: true,
            },
          },
          sso: {
            select: {
              id: true,
              url: true,
              key: true,
            },
          },
        },
      }),
      prisma.loginHistory.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    logger.info(`Fetched login history`, {
      service: 'auth-api',
      count: loginHistory.length,
      total,
      page,
      totalPages,
    });

    res.json({
      data: loginHistory,
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
    logger.error('Error fetching login history', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to fetch login history' });
  }
};

export const getLoginHistoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const loginHistory = await prisma.loginHistory.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
          },
        },
        sso: {
          select: {
            id: true,
            url: true,
            key: true,
          },
        },
      },
    });

    if (!loginHistory) {
      return res.status(404).json({ error: 'Login history entry not found' });
    }

    logger.info(`Fetched login history by ID`, {
      service: 'auth-api',
      loginHistoryId: id,
    });

    res.json(loginHistory);
  } catch (error) {
    logger.error('Error fetching login history by ID', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to fetch login history entry' });
  }
};

export const createLoginHistory = async (req: Request, res: Response) => {
  try {
    const { ssoId, userId, deviceIP, userAgent, location } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ 
        error: 'Missing required field: userId' 
      });
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Validate SSO if provided
    if (ssoId) {
      const sso = await prisma.sSO.findUnique({
        where: { id: ssoId },
      });
      if (!sso) {
        return res.status(400).json({ error: 'Invalid SSO ID' });
      }
    }

    const loginHistory = await prisma.loginHistory.create({
      data: {
        ssoId: ssoId || null,
        userId,
        deviceIP: deviceIP || null,
        userAgent: userAgent || null,
        location: location || null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
          },
        },
        sso: {
          select: {
            id: true,
            url: true,
            key: true,
          },
        },
      },
    });

    logger.info(`Created new login history entry`, {
      service: 'auth-api',
      loginHistoryId: loginHistory.id,
      userId: loginHistory.userId,
    });

    res.status(201).json(loginHistory);
  } catch (error) {
    logger.error('Error creating login history entry', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to create login history entry' });
  }
};

export const updateLoginHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, logoutAt, location } = req.body;

    // Check if login history entry exists
    const existingEntry = await prisma.loginHistory.findUnique({
      where: { id },
    });

    if (!existingEntry) {
      return res.status(404).json({ error: 'Login history entry not found' });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (logoutAt !== undefined) updateData.logoutAt = logoutAt ? new Date(logoutAt) : null;
    if (location !== undefined) updateData.location = location;

    const loginHistory = await prisma.loginHistory.update({
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
        sso: {
          select: {
            id: true,
            url: true,
            key: true,
          },
        },
      },
    });

    logger.info(`Updated login history entry`, {
      service: 'auth-api',
      loginHistoryId: id,
    });

    res.json(loginHistory);
  } catch (error) {
    logger.error('Error updating login history entry', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to update login history entry' });
  }
};

export const deleteLoginHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if login history entry exists
    const existingEntry = await prisma.loginHistory.findUnique({
      where: { id },
    });

    if (!existingEntry) {
      return res.status(404).json({ error: 'Login history entry not found' });
    }

    await prisma.loginHistory.delete({
      where: { id },
    });

    logger.info(`Deleted login history entry`, {
      service: 'auth-api',
      loginHistoryId: id,
    });

    res.json({ message: 'Login history entry deleted successfully' });
  } catch (error) {
    logger.error('Error deleting login history entry', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to delete login history entry' });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const loginHistory = await prisma.loginHistory.update({
      where: { id },
      data: {
        status: 'logged_out',
        logoutAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
          },
        },
        sso: {
          select: {
            id: true,
            url: true,
            key: true,
          },
        },
      },
    });

    logger.info(`Logged out user`, {
      service: 'auth-api',
      loginHistoryId: id,
    });

    res.json(loginHistory);
  } catch (error) {
    logger.error('Error logging out user', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to log out user' });
  }
};

export const getLoginStats = async (req: Request, res: Response) => {
  try {
    const [totalLogins, activeLogins, loggedOutLogins, expiredLogins] = await Promise.all([
      prisma.loginHistory.count(),
      prisma.loginHistory.count({ where: { status: 'active' } }),
      prisma.loginHistory.count({ where: { status: 'logged_out' } }),
      prisma.loginHistory.count({ where: { status: 'expired' } }),
    ]);

    // Get unique users who have logged in
    const uniqueUsers = await prisma.loginHistory.groupBy({
      by: ['userId'],
    });

    const stats = {
      totalLogins,
      activeLogins,
      loggedOutLogins,
      expiredLogins,
      uniqueUsers: uniqueUsers.length,
    };

    logger.info(`Fetched login stats`, {
      service: 'auth-api',
      stats,
    });

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching login stats', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to fetch login stats' });
  }
};