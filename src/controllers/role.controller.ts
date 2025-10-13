import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
const prisma = new PrismaClient();

export async function getRoles(req: Request, res: Response) {
  try {
    const roles = await prisma.role.findMany({
      include: { permissions: true }
    });
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
}

export async function createRole(req: Request, res: Response) {
  const { name, permissions } = req.body;
  try {
    const role = await prisma.role.create({
      data: {
        name,
        permissions: {
          connect: permissions?.map((pid: string) => ({ id: pid })) || []
        }
      }
    });
    res.json(role);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create role' });
  }
}

export async function updateRole(req: Request, res: Response) {
  const { id } = req.params;
  const { name, permissions } = req.body;
  try {
    const role = await prisma.role.update({
      where: { id },
      data: {
        name,
        permissions: {
          set: permissions?.map((pid: string) => ({ id: pid })) || []
        }
      }
    });
    res.json(role);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role' });
  }
}
