import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as socketService from '../services/socket.service';

const prisma = new PrismaClient();

export const getAllSockets = async (req: Request, res: Response) => {
  const sockets = await prisma.socketConfig.findMany();
  res.json(sockets);
};

export const getSocketById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const socket = await prisma.socketConfig.findUnique({ where: { id } });
  if (!socket) return res.status(404).json({ error: 'Socket config not found' });
  res.json(socket);
};

export const createSocket = async (req: Request, res: Response) => {
  const { name, host, port, isActive = true } = req.body;
  const socket = await prisma.socketConfig.create({
    data: { name, host, port, isActive },
  });
  res.status(201).json(socket);
};

export const updateSocket = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, host, port, isActive } = req.body;
  const socket = await prisma.socketConfig.update({
    where: { id },
    data: { name, host, port, isActive },
  });
  res.json(socket);
};

export const deleteSocket = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.socketConfig.delete({ where: { id } });
  res.status(204).send();
};

// --- Socket Event CRUD ---
export const getSocketEvents = async (req: Request, res: Response) => {
  const { socketConfigId } = req.params;
  const events = await prisma.socketEvent.findMany({ where: { socketConfigId } });
  res.json(events);
};

export const createSocketEvent = async (req: Request, res: Response) => {
  const { socketConfigId } = req.params;
  const { type, event } = req.body;
  const newEvent = await prisma.socketEvent.create({
    data: { socketConfigId, type, event },
  });
  res.status(201).json(newEvent);
};

export const deleteSocketEvent = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.socketEvent.delete({ where: { id } });
  res.status(204).send();
};

// --- Add user to socket event ---
export const addUserToSocketEvent = async (req: Request, res: Response) => {
  const { socketConfigId } = req.params;
  const { userId, eventType } = req.body;
  // Here you can implement logic to associate a user with a socket event, e.g. store in a join table or emit event
  // For mock/demo, just return success
  res.json({ message: `User ${userId} added to event ${eventType} on socket ${socketConfigId}` });
};

export const pingSocket = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await socketService.pingSocket(id);
    res.json({ message: result });
  } catch (e: any) {
    res.status(500).json({ message: e.message || 'Ping failed' });
  }
};

export const testSocketEvent = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { event, payload } = req.body;
  try {
    const result = await socketService.testSocketEvent(id, event, payload);
    res.json({ message: result });
  } catch (e: any) {
    res.status(500).json({ message: e.message || 'Test event failed' });
  }
};
