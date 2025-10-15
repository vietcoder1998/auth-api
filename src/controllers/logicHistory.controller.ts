import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simple logger function
const logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
};

export const getLogicHistory = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const userId = req.query.userId as string;
    const action = req.query.action as string;
    const entityType = req.query.entityType as string;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { action: { contains: search } },
        { entityType: { contains: search } },
        { entityId: { contains: search } },
        { ipAddress: { contains: search } },
        { user: { email: { contains: search } } },
        { user: { nickname: { contains: search } } },
      ];
    }

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    // Debug: Check total count first
    const totalCount = await prisma.logicHistory.count();
    const [logicHistory, total] = await Promise.all([
      prisma.logicHistory.findMany({
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
          notificationTemplate: {
            select: {
              id: true,
              name: true,
              title: true,
            },
          },
        },
      }),
      prisma.logicHistory.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const responseData = {
      data: logicHistory,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    logger.info(`Fetched logic history`, {
      service: 'auth-api',
      count: logicHistory.length,
      total,
      page,
      totalPages,
    });

    res.json(responseData);
  } catch (error) {
    logger.error('Error fetching logic history', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to fetch logic history' });
  }
};

export const getLogicHistoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const logicHistory = await prisma.logicHistory.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
          },
        },
        notificationTemplate: {
          select: {
            id: true,
            name: true,
            title: true,
            body: true,
          },
        },
      },
    });

    if (!logicHistory) {
      return res.status(404).json({ error: 'Logic history entry not found' });
    }

    logger.info(`Fetched logic history by ID`, {
      service: 'auth-api',
      logicHistoryId: id,
    });

    res.json(logicHistory);
  } catch (error) {
    logger.error('Error fetching logic history by ID', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to fetch logic history entry' });
  }
};

export const createLogicHistory = async (req: Request, res: Response) => {
  try {
    const { 
      userId, 
      action, 
      entityType, 
      entityId, 
      oldValues, 
      newValues, 
      ipAddress, 
      userAgent, 
      notificationTemplateId 
    } = req.body;

    // Validate required fields
    if (!userId || !action) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, action' 
      });
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Validate notification template if provided
    if (notificationTemplateId) {
      const template = await prisma.notificationTemplate.findUnique({
        where: { id: notificationTemplateId },
      });
      if (!template) {
        return res.status(400).json({ error: 'Invalid notification template ID' });
      }
    }

    const logicHistory = await prisma.logicHistory.create({
      data: {
        userId,
        action,
        entityType: entityType || null,
        entityId: entityId || null,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        notificationTemplateId: notificationTemplateId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
          },
        },
        notificationTemplate: {
          select: {
            id: true,
            name: true,
            title: true,
          },
        },
      },
    });

    logger.info(`Created new logic history entry`, {
      service: 'auth-api',
      logicHistoryId: logicHistory.id,
      userId: logicHistory.userId,
      action: logicHistory.action,
    });

    res.status(201).json(logicHistory);
  } catch (error) {
    logger.error('Error creating logic history entry', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to create logic history entry' });
  }
};

export const updateLogicHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notificationSent, notificationTemplateId } = req.body;

    // Check if logic history entry exists
    const existingEntry = await prisma.logicHistory.findUnique({
      where: { id },
    });

    if (!existingEntry) {
      return res.status(404).json({ error: 'Logic history entry not found' });
    }

    // Validate notification template if provided
    if (notificationTemplateId) {
      const template = await prisma.notificationTemplate.findUnique({
        where: { id: notificationTemplateId },
      });
      if (!template) {
        return res.status(400).json({ error: 'Invalid notification template ID' });
      }
    }

    const updateData: any = {};
    if (notificationSent !== undefined) updateData.notificationSent = notificationSent;
    if (notificationTemplateId !== undefined) updateData.notificationTemplateId = notificationTemplateId;

    const logicHistory = await prisma.logicHistory.update({
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
        notificationTemplate: {
          select: {
            id: true,
            name: true,
            title: true,
          },
        },
      },
    });

    logger.info(`Updated logic history entry`, {
      service: 'auth-api',
      logicHistoryId: id,
    });

    res.json(logicHistory);
  } catch (error) {
    logger.error('Error updating logic history entry', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to update logic history entry' });
  }
};

export const deleteLogicHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if logic history entry exists
    const existingEntry = await prisma.logicHistory.findUnique({
      where: { id },
    });

    if (!existingEntry) {
      return res.status(404).json({ error: 'Logic history entry not found' });
    }

    await prisma.logicHistory.delete({
      where: { id },
    });

    logger.info(`Deleted logic history entry`, {
      service: 'auth-api',
      logicHistoryId: id,
    });

    res.json({ message: 'Logic history entry deleted successfully' });
  } catch (error) {
    logger.error('Error deleting logic history entry', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to delete logic history entry' });
  }
};

export const markNotificationSent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const logicHistory = await prisma.logicHistory.update({
      where: { id },
      data: {
        notificationSent: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
          },
        },
        notificationTemplate: {
          select: {
            id: true,
            name: true,
            title: true,
          },
        },
      },
    });

    logger.info(`Marked notification as sent`, {
      service: 'auth-api',
      logicHistoryId: id,
    });

    res.json(logicHistory);
  } catch (error) {
    logger.error('Error marking notification as sent', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to mark notification as sent' });
  }
};

export const getLogicHistoryStats = async (req: Request, res: Response) => {
  try {
    const [totalEntries, notificationsSent, pendingNotifications] = await Promise.all([
      prisma.logicHistory.count(),
      prisma.logicHistory.count({ where: { notificationSent: true } }),
      prisma.logicHistory.count({ 
        where: { 
          notificationSent: false,
          notificationTemplateId: { not: null }
        } 
      }),
    ]);

    // Get action statistics
    const actionStats = await prisma.logicHistory.groupBy({
      by: ['action'],
      _count: {
        action: true,
      },
      orderBy: {
        _count: {
          action: 'desc',
        },
      },
    });

    const stats = {
      totalEntries,
      notificationsSent,
      pendingNotifications,
      actionBreakdown: actionStats.map(stat => ({
        action: stat.action,
        count: stat._count.action,
      })),
    };

    logger.info(`Fetched logic history stats`, {
      service: 'auth-api',
      stats,
    });

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching logic history stats', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to fetch logic history stats' });
  }
};