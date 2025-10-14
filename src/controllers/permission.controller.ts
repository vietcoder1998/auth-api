import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
const prisma = new PrismaClient();

export async function getPermissions(req: Request, res: Response) {
  try {
    const permissions = await prisma.permission.findMany({
      include: { roles: true }
    });
    res.json(permissions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
}

export async function createPermission(req: Request, res: Response) {
  const { name, description, category, route, method, roles } = req.body;
  try {
    const permission = await prisma.permission.create({
      data: {
        name,
        description,
        category: category || 'other',
        route,
        method,
        roles: {
          connect: roles?.map((rid: string) => ({ id: rid })) || []
        }
      }
    });
    res.json(permission);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create permission' });
  }
}

export async function updatePermission(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description, category, route, method, roles } = req.body;
  try {
    const permission = await prisma.permission.update({
      where: { id },
      data: {
        name,
        description,
        category,
        route,
        method,
        roles: {
          set: roles?.map((rid: string) => ({ id: rid })) || []
        }
      }
    });
    res.json(permission);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update permission' });
  }
}

export async function deletePermission(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await prisma.permission.delete({
      where: { id }
    });
    res.json({ message: 'Permission deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete permission' });
  }
}
