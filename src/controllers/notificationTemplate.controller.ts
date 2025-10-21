import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
const prisma = new PrismaClient();

export const getNotificationTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await prisma.notificationTemplate.findMany();
    res.json(templates);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errMsg });
  }
};

export const getNotificationTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await prisma.notificationTemplate.findUnique({ where: { id } });
    if (!template) {
      return res.status(404).json({ error: 'Notification template not found' });
    }
    res.json(template);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errMsg });
  }
};

export const createNotificationTemplate = async (req: Request, res: Response) => {
  try {
    const { name, title, body, active } = req.body;
    const template = await prisma.notificationTemplate.create({
      data: {
        name,
        title,
        body,
        active: active ?? true,
      },
    });
    res.status(201).json(template);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errMsg });
  }
};

export const updateNotificationTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, title, body, active } = req.body;
    const template = await prisma.notificationTemplate.update({
      where: { id },
      data: {
        name,
        title,
        body,
        active,
      },
    });
    res.json(template);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errMsg });
  }
};

export const deleteNotificationTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.notificationTemplate.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errMsg });
  }
};
