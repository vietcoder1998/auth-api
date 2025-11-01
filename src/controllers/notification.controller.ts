import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create notification
export const createNotification = async (request: Request, response: Response) => {
  try {
    const { message, type, templateId, errorPayload, userId } = request.body;
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
    response.status(201).json(notification);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    response.status(500).json({ error: errMsg });
  }
};

// Get all notifications
export const getNotifications = async (request: Request, response: Response) => {
  try {
    // Only return notifications with status != 0
    const notifications = await prisma.notification.findMany({
      where: { status: { not: 0 } },
    });
    response.json(notifications);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    response.status(500).json({ error: errMsg });
  }
};

// Get notification by ID
export const getNotificationById = async (request: Request, response: Response) => {
  try {
    const { id } = request.params;
    const notification = await prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) {
      return response.status(404).json({ error: 'notification not found' });
    }
    response.json(notification);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    response.status(500).json({ error: errMsg });
  }
};

// Update notification
export const updateNotification = async (request: Request, response: Response) => {
  try {
    const { id } = request.params;
    const { message, type, templateId, errorPayload, userId, read } = request.body;
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
    response.json(notification);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    response.status(500).json({ error: errMsg });
  }
};

// Delete notification
export const deleteNotification = async (request: Request, response: Response) => {
  try {
    const { id } = request.params;
    // Instead of deleting, set status to 0 (hidden)
    await prisma.notification.update({
      where: { id },
      data: { status: 0 },
    });
    response.status(204).send();
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    response.status(500).json({ error: errMsg });
  }
};

// Push notification with error payload
export const pushNotification = async (request: Request, response: Response) => {
  try {
    const { message, type, errorPayload, userId } = request.body;
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
    response.status(201).json(notification);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    response.status(500).json({ error: errMsg });
  }
};
