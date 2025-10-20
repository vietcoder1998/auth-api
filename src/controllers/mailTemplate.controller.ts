import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simple logger function
const logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
};

export const getMailTemplates = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const active = req.query.active as string;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [{ name: { contains: search } }, { subject: { contains: search } }];
    }

    if (active !== undefined) {
      where.active = active === 'true';
    }

    const [templates, total] = await Promise.all([
      prisma.mailTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              mails: true,
            },
          },
        },
      }),
      prisma.mailTemplate.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    logger.info(`Fetched mail templates`, {
      service: 'auth-api',
      count: templates.length,
      total,
      page,
      totalPages,
    });

    res.json({
      data: templates,
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
    logger.error('Error fetching mail templates', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to fetch mail templates' });
  }
};

export const getMailTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.mailTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            mails: true,
          },
        },
      },
    });

    if (!template) {
      return res.status(404).json({ error: 'Mail template not found' });
    }

    logger.info(`Fetched mail template by ID`, {
      service: 'auth-api',
      templateId: id,
    });

    res.json(template);
  } catch (error) {
    logger.error('Error fetching mail template by ID', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to fetch mail template' });
  }
};

export const createMailTemplate = async (req: Request, res: Response) => {
  try {
    const { name, subject, body, active } = req.body;

    // Validate required fields
    if (!name || !subject || !body) {
      return res.status(400).json({
        error: 'Missing required fields: name, subject, body',
      });
    }

    // Check if template name already exists
    const existingTemplate = await prisma.mailTemplate.findUnique({
      where: { name },
    });

    if (existingTemplate) {
      return res.status(400).json({ error: 'Template name already exists' });
    }

    const template = await prisma.mailTemplate.create({
      data: {
        name,
        subject,
        body,
        active: active !== undefined ? active : true,
      },
    });

    logger.info(`Created new mail template`, {
      service: 'auth-api',
      templateId: template.id,
      name: template.name,
    });

    res.status(201).json(template);
  } catch (error) {
    logger.error('Error creating mail template', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to create mail template' });
  }
};

export const updateMailTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, subject, body, active } = req.body;

    // Check if template exists
    const existingTemplate = await prisma.mailTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: 'Mail template not found' });
    }

    // Check if name is being changed and if new name already exists
    if (name && name !== existingTemplate.name) {
      const duplicateTemplate = await prisma.mailTemplate.findUnique({
        where: { name },
      });

      if (duplicateTemplate) {
        return res.status(400).json({ error: 'Template name already exists' });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (subject !== undefined) updateData.subject = subject;
    if (body !== undefined) updateData.body = body;
    if (active !== undefined) updateData.active = active;

    const template = await prisma.mailTemplate.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Updated mail template`, {
      service: 'auth-api',
      templateId: id,
    });

    res.json(template);
  } catch (error) {
    logger.error('Error updating mail template', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to update mail template' });
  }
};

export const deleteMailTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if template exists
    const existingTemplate = await prisma.mailTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            mails: true,
          },
        },
      },
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: 'Mail template not found' });
    }

    // Check if template is being used by mails
    if (existingTemplate._count.mails > 0) {
      return res.status(400).json({
        error: `Cannot delete template. It is being used by ${existingTemplate._count.mails} mail(s)`,
      });
    }

    await prisma.mailTemplate.delete({
      where: { id },
    });

    logger.info(`Deleted mail template`, {
      service: 'auth-api',
      templateId: id,
    });

    res.json({ message: 'Mail template deleted successfully' });
  } catch (error) {
    logger.error('Error deleting mail template', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to delete mail template' });
  }
};
