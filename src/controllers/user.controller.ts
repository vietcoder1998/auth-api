import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
const prisma = new PrismaClient();

export async function getUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, nickname: true, roleId: true, status: true }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

export async function createUser(req: Request, res: Response) {
  const { email, password, nickname, roleId, status } = req.body;
  try {
    const user = await prisma.user.create({
      data: { email, password, nickname, roleId, status }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const { email, nickname, roleId, status } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { email, nickname, roleId, status }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
}

export async function searchUsers(req: Request, res: Response) {
  const { q } = req.query;
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: String(q) } },
          { nickname: { contains: String(q) } }
        ]
      }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search users' });
  }
}

export async function handoverUserStatus(req: Request, res: Response) {
  const { userId, newStatus } = req.body;
  const requesterId = req.headers['x-user-id'] as string;
  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
    include: { role: true },
  });
  if (!requester || requester.role?.name !== 'superadmin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const user = await prisma.user.update({ where: { id: userId }, data: { status: newStatus } });
  res.json({ user });
}
