import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create notification
export const createNotification = async (req: Request, res: Response) => {
  try {
    const { message, type, templateId, errorPayload, userId } = req.body;
    const notification = await prisma.notification.create({
      data: {
        message,
        type,
        templateId,
        errorPayload,
        userId,
        status: 1,
      },
    });
    res.status(201).json(notification);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errMsg });
  }
};

// Get all notifications
export const getNotifications = async (req: Request, res: Response) => {
  try {
    // Only return notifications with status != 0
    const notifications = await prisma.notification.findMany({
      where: { status: { not: 0 } },
    });
    res.json(notifications);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errMsg });
  }
};

// Get notification by ID
export const getNotificationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) {
      return res.status(404).json({ error: 'notification not found' });
    }
    res.json(notification);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errMsg });
  }
};

// Update notification
export const updateNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { message, type, templateId, errorPayload, userId, read } = req.body;
    const notification = await prisma.notification.update({
      where: { id },
      data: {
        message,
        type,
        templateId,
        errorPayload,
        userId,
        read,
      },
    });
    res.json(notification);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errMsg });
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Instead of deleting, set status to 0 (hidden)
    await prisma.notification.update({
      where: { id },
      data: { status: 0 },
    });
    res.status(204).send();
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errMsg });
  }
};

// Push notification with error payload
export const pushNotification = async (req: Request, res: Response) => {
  try {
    const { message, type, errorPayload, userId } = req.body;
    const notification = await prisma.notification.create({
      data: {
        message,
        type,
        errorPayload,
        userId,
        status: 1,
      },
    });
    // You can add logic here to send notification to user via socket/email/etc
    res.status(201).json(notification);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errMsg });
  }
};
