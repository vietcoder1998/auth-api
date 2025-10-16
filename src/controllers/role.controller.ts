import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { setPaginationMeta } from '../middlewares/response.middleware';
const prisma = new PrismaClient();

export async function getRoles(req: Request, res: Response) {
  try {
    // Extract query parameters
    const {
      page = '1',
      limit = '10',
      pageSize = limit,
      search = '',
      q = search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Parse pagination parameters
    const currentPage = Math.max(1, parseInt(page as string, 10));
    const currentLimit = Math.max(1, Math.min(100, parseInt(pageSize as string, 10)));
    const skip = (currentPage - 1) * currentLimit;

    // Build where clause for search
    const whereClause: any = {};

    // Search across multiple fields
    if (q && typeof q === 'string' && q.trim()) {
      const searchTerm = q.trim();
      whereClause.OR = [
        { name: { contains: searchTerm } },
        { description: { contains: searchTerm } }
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else {
      orderBy.createdAt = 'desc'; // Default
    }

    // Get total count for pagination
    const total = await prisma.role.count({ where: whereClause });

    // Get roles with pagination
    const roles = await prisma.role.findMany({
      where: whereClause,
      include: { 
        permissions: {
          select: {
            id: true,
            name: true,
            category: true
          }
        },
        users: {
          select: {
            id: true,
            email: true,
            nickname: true
          }
        },
        _count: {
          select: {
            permissions: true,
            users: true
          }
        }
      },
      orderBy,
      skip,
      take: currentLimit
    });

    // Set pagination metadata for response middleware
    setPaginationMeta(req, total, currentPage, currentLimit);

    // Return paginated response
    res.json({
      data: roles,
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit)
    });

  } catch (err) {
    console.error('Get roles error:', err);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
}

export async function createRole(req: Request, res: Response) {
  const { name, description, permissions } = req.body;
  try {
    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions: {
          connect: permissions?.map((pid: string) => ({ id: pid })) || []
        }
      },
      include: { permissions: true }
    });
    res.json(role);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create role' });
  }
}

export async function updateRole(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description, permissions } = req.body;
  try {
    const role = await prisma.role.update({
      where: { id },
      data: {
        name,
        description,
        permissions: {
          set: permissions?.map((pid: string) => ({ id: pid })) || []
        }
      },
      include: { permissions: true }
    });
    res.json(role);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role' });
  }
}

export async function deleteRole(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await prisma.role.delete({
      where: { id }
    });
    res.json({ message: 'Role deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete role' });
  }
}
