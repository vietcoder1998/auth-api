import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { ResponseMiddleware } from '../middlewares/response.middleware';
const prisma = new PrismaClient();

export class RoleController extends BaseController<any, any, any> {
  constructor() {
    // We'll need to create a RoleService later, for now pass null
    super(null as any);
  }

  async getRoles(req: Request, res: Response) {
  try {
    // Extract query parameters
    const {
      page = '1',
      limit = '10',
      pageSize = limit,
      search = '',
      q = search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
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
        { description: { contains: searchTerm } },
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    switch (sortBy) {
      case 'name':
        orderBy.name = sortOrder;
        break;
      case 'createdAt':
        orderBy.createdAt = sortOrder;
        break;
      default:
        orderBy.createdAt = 'desc';
        break;
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
            category: true,
          },
        },
        users: {
          select: {
            id: true,
            email: true,
            nickname: true,
          },
        },
        _count: {
          select: {
            permissions: true,
            users: true,
          },
        },
      },
      orderBy,
      skip,
      take: currentLimit,
    });

    // Set pagination metadata for response middleware
    ResponseMiddleware.setPaginationMeta(req, total, currentPage, currentLimit);

    // Return paginated response
    this.sendSuccess(res, {
      data: roles,
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit),
    });
  } catch (err) {
    console.error('Get roles error:', err);
    this.handleError(res, err);
  }
  }

  async createRole(req: Request, res: Response) {
  const { name, description, permissions } = req.body;
  try {
    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions: {
          connect: permissions?.map((pid: string) => ({ id: pid })) || [],
        },
      },
      include: { permissions: true },
    });
    this.sendSuccess(res, role);
  } catch (err) {
    this.handleError(res, err);
  }
  }

  async updateRole(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description, permissions } = req.body;
  try {
    const role = await prisma.role.update({
      where: { id },
      data: {
        name,
        description,
        permissions: {
          set: permissions?.map((pid: string) => ({ id: pid })) || [],
        },
      },
      include: { permissions: true },
    });
    this.sendSuccess(res, role);
  } catch (err) {
    this.handleError(res, err);
  }
  }

  async deleteRole(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await prisma.role.delete({
      where: { id },
    });
    this.sendSuccess(res, null, 'Role deleted successfully');
  } catch (err) {
    this.handleError(res, err);
  }
  }

  async getPermissionsNotInRole(req: Request, res: Response) {
  try {
    const { id } = req.params; // role id
    const {
      page = '1',
      limit = '50',
      pageSize = limit,
      search = '',
      q = search,
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query;

    // Parse pagination parameters
    const currentPage = Math.max(1, parseInt(page as string, 10));
    const currentLimit = Math.max(1, Math.min(100, parseInt(pageSize as string, 10)));
    const skip = (currentPage - 1) * currentLimit;

    // First, get the role to ensure it exists
    const role = await prisma.role.findUnique({
      where: { id },
      include: { permissions: { select: { id: true } } },
    });

    if (!role) {
      return this.handleError(res, 'Role not found', 404);
    }

    // Get IDs of permissions already in the role
    const rolePermissionIds = role.permissions.map((p) => p.id);

    // Build where clause for search and exclusion
    const whereClause: any = {
      id: {
        notIn: rolePermissionIds,
      },
    };

    // Search across multiple fields
    if (q && typeof q === 'string' && q.trim()) {
      const searchTerm = q.trim();
      whereClause.OR = [
        { name: { contains: searchTerm } },
        { description: { contains: searchTerm } },
        { category: { contains: searchTerm } },
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    switch (sortBy) {
      case 'name':
        orderBy.name = sortOrder;
        break;
      case 'category':
        orderBy.category = sortOrder;
        break;
      case 'createdAt':
        orderBy.createdAt = sortOrder;
        break;
      default:
        orderBy.name = 'asc';
        break;
    }

    // Get total count for pagination
    const total = await prisma.permission.count({ where: whereClause });

    // Get permissions not in role with pagination
    const permissions = await prisma.permission.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: currentLimit,
    });

    this.sendSuccess(res, {
      data: permissions,
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit),
      roleInfo: {
        id: role.id,
        name: role.name,
        description: role.description,
        currentPermissionsCount: rolePermissionIds.length,
      },
    });
  } catch (err) {
    console.error('Get permissions not in role error:', err);
    this.handleError(res, err);
  }
  }

  async addPermissionsToRole(req: Request, res: Response) {
  try {
    const { id } = req.params; // role id
    const { permissionIds } = req.body;

    if (!permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) {
      return this.handleError(res, 'Permission IDs array is required', 400);
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });

    if (!role) {
      return this.handleError(res, 'Role not found', 404);
    }

    // Get current permission IDs
    const currentPermissionIds = role.permissions.map((p) => p.id);

    // Filter out permissions that are already in the role
    const newPermissionIds = permissionIds.filter((pid) => !currentPermissionIds.includes(pid));

    if (newPermissionIds.length === 0) {
      return this.handleError(res, 'All provided permissions are already in the role', 400);
    }

    // Update role with new permissions (connect additional permissions)
    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        permissions: {
          connect: newPermissionIds.map((pid) => ({ id: pid })),
        },
      },
      include: {
        permissions: {
          orderBy: { name: 'asc' },
        },
      },
    });

    this.sendSuccess(res, {
      message: `Successfully added ${newPermissionIds.length} permission(s) to role`,
      role: updatedRole,
      addedPermissionsCount: newPermissionIds.length,
      totalPermissionsCount: updatedRole.permissions.length,
    });
  } catch (err) {
    console.error('Add permissions to role error:', err);
    this.handleError(res, err);
  }
  }
}

export const roleController = new RoleController();
