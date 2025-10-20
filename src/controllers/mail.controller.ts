import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simple logger function
const logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
};

export const getMails = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { to: { contains: search } },
        { from: { contains: search } },
        { subject: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [mails, total] = await Promise.all([
      prisma.mail.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          template: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.mail.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    logger.info(`Fetched mails`, {
      service: 'auth-api',
      count: mails.length,
      total,
      page,
      totalPages,
    });

    res.json({
      data: mails,
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
    logger.error('Error fetching mails', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to fetch mails' });
  }
};

export const getMailById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const mail = await prisma.mail.findUnique({
      where: { id },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            subject: true,
            body: true,
          },
        },
      },
    });

    if (!mail) {
      return res.status(404).json({ error: 'Mail not found' });
    }

    logger.info(`Fetched mail by ID`, {
      service: 'auth-api',
      mailId: id,
    });

    res.json(mail);
  } catch (error) {
    logger.error('Error fetching mail by ID', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to fetch mail' });
  }
};

export const createMail = async (req: Request, res: Response) => {
  try {
    const { to, from, subject, body, status, templateId } = req.body;

    // Validate required fields
    if (!to || !subject || !body) {
      return res.status(400).json({
        error: 'Missing required fields: to, subject, body',
      });
    }

    // Validate template if provided
    if (templateId) {
      const template = await prisma.mailTemplate.findUnique({
        where: { id: templateId },
      });
      if (!template) {
        return res.status(400).json({ error: 'Invalid template ID' });
      }
    }

    const mail = await prisma.mail.create({
      data: {
        to,
        from: from || null,
        subject,
        body,
        status: status || 'pending',
        templateId: templateId || null,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logger.info(`Created new mail`, {
      service: 'auth-api',
      mailId: mail.id,
      to: mail.to,
    });

    res.status(201).json(mail);
  } catch (error) {
    logger.error('Error creating mail', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to create mail' });
  }
};

export const updateMail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { to, from, subject, body, status, templateId, sentAt, failedReason } = req.body;

    // Check if mail exists
    const existingMail = await prisma.mail.findUnique({
      where: { id },
    });

    if (!existingMail) {
      return res.status(404).json({ error: 'Mail not found' });
    }

    // Validate template if provided
    if (templateId) {
      const template = await prisma.mailTemplate.findUnique({
        where: { id: templateId },
      });
      if (!template) {
        return res.status(400).json({ error: 'Invalid template ID' });
      }
    }

    const updateData: any = {};
    if (to !== undefined) updateData.to = to;
    if (from !== undefined) updateData.from = from;
    if (subject !== undefined) updateData.subject = subject;
    if (body !== undefined) updateData.body = body;
    if (status !== undefined) updateData.status = status;
    if (templateId !== undefined) updateData.templateId = templateId;
    if (sentAt !== undefined) updateData.sentAt = sentAt ? new Date(sentAt) : null;
    if (failedReason !== undefined) updateData.failedReason = failedReason;

    const mail = await prisma.mail.update({
      where: { id },
      data: updateData,
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logger.info(`Updated mail`, {
      service: 'auth-api',
      mailId: id,
    });

    res.json(mail);
  } catch (error) {
    logger.error('Error updating mail', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to update mail' });
  }
};

export const deleteMail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if mail exists
    const existingMail = await prisma.mail.findUnique({
      where: { id },
    });

    if (!existingMail) {
      return res.status(404).json({ error: 'Mail not found' });
    }

    await prisma.mail.delete({
      where: { id },
    });

    logger.info(`Deleted mail`, {
      service: 'auth-api',
      mailId: id,
    });

    res.json({ message: 'Mail deleted successfully' });
  } catch (error) {
    logger.error('Error deleting mail', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to delete mail' });
  }
};

export const markMailAsSent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const mail = await prisma.mail.update({
      where: { id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        failedReason: null,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logger.info(`Marked mail as sent`, {
      service: 'auth-api',
      mailId: id,
    });

    res.json(mail);
  } catch (error) {
    logger.error('Error marking mail as sent', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to mark mail as sent' });
  }
};

export const markMailAsFailed = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { failedReason } = req.body;

    const mail = await prisma.mail.update({
      where: { id },
      data: {
        status: 'failed',
        failedReason: failedReason || 'Unknown error',
        sentAt: null,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logger.info(`Marked mail as failed`, {
      service: 'auth-api',
      mailId: id,
      failedReason,
    });

    res.json(mail);
  } catch (error) {
    logger.error('Error marking mail as failed', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to mark mail as failed' });
  }
};

export const getMailStats = async (req: Request, res: Response) => {
  try {
    const [totalMails, pendingMails, sentMails, failedMails] = await Promise.all([
      prisma.mail.count(),
      prisma.mail.count({ where: { status: 'pending' } }),
      prisma.mail.count({ where: { status: 'sent' } }),
      prisma.mail.count({ where: { status: 'failed' } }),
    ]);

    const stats = {
      total: totalMails,
      pending: pendingMails,
      sent: sentMails,
      failed: failedMails,
      successRate: totalMails > 0 ? ((sentMails / totalMails) * 100).toFixed(2) : '0.00',
    };

    logger.info(`Fetched mail stats`, {
      service: 'auth-api',
      stats,
    });

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching mail stats', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to fetch mail stats' });
  }
};

export const resendMail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if mail exists
    const existingMail = await prisma.mail.findUnique({
      where: { id },
    });

    if (!existingMail) {
      return res.status(404).json({ error: 'Mail not found' });
    }

    // Reset mail status to pending for resending
    const mail = await prisma.mail.update({
      where: { id },
      data: {
        status: 'pending',
        sentAt: null,
        failedReason: null,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logger.info(`Reset mail for resending`, {
      service: 'auth-api',
      mailId: id,
    });

    res.json(mail);
  } catch (error) {
    logger.error('Error resending mail', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to resend mail' });
  }
};
