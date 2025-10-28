import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { logInfo, logError } from '../middlewares/logger.middle';
import { ResponseMiddleware } from '../middlewares/response.middleware';

const prisma = new PrismaClient();

export class PermissionController extends BaseController<any, any, any> {
  constructor() {
    // We'll need to create a PermissionService later, for now pass null
    super(null as any);
  }

  async getPermissions(req: Request, res: Response) {
  try {
    // Extract query parameters
    const {
      page = '1',
      limit = '10',
      pageSize = limit,
      search = '',
      q = search,
      category,
      method,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Parse pagination parameters
    const currentPage = Math.max(1, parseInt(page as string, 10));
    const currentLimit = Math.max(1, Math.min(100, parseInt(pageSize as string, 10)));
    const skip = (currentPage - 1) * currentLimit;

    // Build where clause for search and filters
    const whereClause: any = {};

    // Search across multiple fields
    if (q && typeof q === 'string' && q.trim()) {
      const searchTerm = q.trim();
      whereClause.OR = [
        { name: { contains: searchTerm } },
        { description: { contains: searchTerm } },
        { category: { contains: searchTerm } },
        { route: { contains: searchTerm } },
        { method: { contains: searchTerm } },
        {
          roles: {
            some: {
              name: { contains: searchTerm },
            },
          },
        },
      ];
    }

    // Category filter
    if (category && typeof category === 'string') {
      whereClause.category = category;
    }

    // Method filter
    if (method && typeof method === 'string') {
      whereClause.method = method;
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
        orderBy.createdAt = 'desc';
        break;
    }

    // Get total count for pagination
    const total = await prisma.permission.count({ where: whereClause });

    // Get permissions with pagination
    const permissions = await prisma.permission.findMany({
      where: whereClause,
      include: {
        roles: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy,
      skip,
      take: currentLimit,
    });

    // Add usage count calculation (simulation)
    // NOTE: This is a simulation. For production, implement real usage tracking by:
    // 1. Creating a PermissionUsage table with permissionId, userId, timestamp
    // 2. Logging usage in middleware when permissions are checked
    // 3. Aggregating counts with: SELECT permissionId, COUNT(*) FROM permission_usage GROUP BY permissionId
    const permissionsWithUsage = permissions.map((permission) => {
      let baseUsage = 0;

      // Higher usage for permissions assigned to more roles
      const roleMultiplier = permission.roles.length * 50;

      // Category-based usage patterns
      const categoryMultipliers = {
        user: 200, // User management is frequently used
        system: 100, // System operations are common
        api: 150, // API endpoints get regular hits
        role: 75, // Role management is moderately used
        permission: 25, // Permission management is less frequent
        report: 300, // Reports are heavily accessed
        other: 50, // Default for other categories
      };

      const categoryUsage =
        categoryMultipliers[permission.category as keyof typeof categoryMultipliers] || 50;

      // Route-based usage (routes get more hits than abstract permissions)
      const routeBonus = permission.route ? 100 : 0;

      // Calculate final usage with some randomness (but consistent per permission)
      const seed = permission.id.charCodeAt(0) + permission.name.length;
      const randomFactor = 0.5 + (seed % 100) / 100; // Consistent randomness
      baseUsage = roleMultiplier + categoryUsage + routeBonus;

      return {
        ...permission,
        usageCount: Math.floor(baseUsage * randomFactor),
      };
    });

    // Set pagination metadata for response middleware
    ResponseMiddleware.setPaginationMeta(req, total, currentPage, currentLimit);

    // Return paginated response
    this.sendSuccess(res, {
      data: permissionsWithUsage,
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit),
      hasNextPage: currentPage < Math.ceil(total / currentLimit),
      hasPrevPage: currentPage > 1,
    });
  } catch (err) {
    logError('Failed to fetch permissions:', err);
    this.handleError(res, err);
  }
  }

  async createPermission(req: Request, res: Response) {
  const { name, description, category, route, method, roles } = req.body;
  try {
    // Check if permission already exists
    let permission = await prisma.permission.findUnique({ where: { name } });
    if (permission) {
      // Update existing permission
      permission = await prisma.permission.update({
        where: { id: permission.id },
        data: {
          description,
          category: category || 'other',
          route,
          method,
          roles: {
            connect: roles?.map((rid: string) => ({ id: rid })) || [],
          },
        },
      });
    } else {
      // Create new permission
      permission = await prisma.permission.create({
        data: {
          name,
          description,
          category: category || 'other',
          route,
          method,
          roles: {
            connect: roles?.map((rid: string) => ({ id: rid })) || [],
          },
        },
      });
    }

    // Automatically add this permission to the superadmin role
    const superadminRole = await prisma.role.findUnique({
      where: { name: 'superadmin' },
      include: { permissions: true },
    });

    if (superadminRole) {
      // Check if permission is already connected to superadmin
      const hasPermission = superadminRole.permissions.some((p) => p.id === permission.id);
      if (!hasPermission) {
        await prisma.role.update({
          where: { id: superadminRole.id },
          data: {
            permissions: {
              connect: { id: permission.id },
            },
          },
        });
        logInfo(`Permission '${name}' added to superadmin role`);
      }
    } else {
      logError('Superadmin role not found - permission not added to superadmin');
    }

    this.sendSuccess(res, permission);
  } catch (err) {
    logError('Failed to create/update permission:', err);
    this.handleError(res, err);
  }
  }

  async updatePermission(req: Request, res: Response) {
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
          set: roles?.map((rid: string) => ({ id: rid })) || [],
        },
      },
    });
    this.sendSuccess(res, permission);
  } catch (err) {
    this.handleError(res, err);
  }
  }

  async deletePermission(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await prisma.permission.delete({
      where: { id },
    });
    this.sendSuccess(res, null, 'Permission deleted successfully');
  } catch (err) {
    this.handleError(res, err);
  }
  }

  async createPermissionWithSuperadmin(req: Request, res: Response) {
  const { name, description, category, route, method } = req.body;

    if (!name) {
      return this.handleError(res, 'Permission name is required', 400);
    }  try {
    // Check if permission already exists
    const existingPermission = await prisma.permission.findUnique({
      where: { name },
    });

    if (existingPermission) {
      return this.handleError(res, 'Permission already exists', 409);
    }

    // Find superadmin role first
    const superadminRole = await prisma.role.findUnique({
      where: { name: 'superadmin' },
    });

    if (!superadminRole) {
      return this.handleError(res, 'Superadmin role not found', 404);
    }

    // Create permission and connect to superadmin role in one transaction
    const permission = await prisma.$transaction(async (tx) => {
      const newPermission = await tx.permission.create({
        data: {
          name,
          description,
          category: category || 'other',
          route,
          method,
          roles: {
            connect: { id: superadminRole.id },
          },
        },
        include: {
          roles: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return newPermission;
    });

    logInfo(`Permission '${name}' created and added to superadmin role`, {
      permissionId: permission.id,
      category: permission.category,
      route: permission.route,
      method: permission.method,
    });

    this.sendSuccess(res, {
      success: true,
      message: 'Permission created and added to superadmin successfully',
      data: permission,
    });
  } catch (err) {
    logError('Failed to create permission with superadmin:', err);
    this.handleError(res, err);
  }
  }

  async addPermissionToSuperadmin(req: Request, res: Response) {
  const { permissionId } = req.params;

  try {
    // Find the permission
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: { roles: true },
    });

    if (!permission) {
      return this.handleError(res, 'Permission not found', 404);
    }

    // Find superadmin role
    const superadminRole = await prisma.role.findUnique({
      where: { name: 'superadmin' },
      include: { permissions: true },
    });

    if (!superadminRole) {
      return this.handleError(res, 'Superadmin role not found', 404);
    }

    // Check if permission is already connected to superadmin
    const hasPermission = superadminRole.permissions.some((p) => p.id === permissionId);

    if (hasPermission) {
      return this.sendSuccess(res, {
        success: true,
        message: 'Permission already assigned to superadmin',
        data: { permission, role: superadminRole },
      });
    }

    // Add permission to superadmin role
    await prisma.role.update({
      where: { id: superadminRole.id },
      data: {
        permissions: {
          connect: { id: permissionId },
        },
      },
    });

    logInfo(`Permission '${permission.name}' added to superadmin role`, {
      permissionId: permission.id,
      permissionName: permission.name,
    });

    this.sendSuccess(res, {
      success: true,
      message: 'Permission added to superadmin successfully',
      data: { permission, role: superadminRole },
    });
  } catch (err) {
    logError('Failed to add permission to superadmin:', err);
    this.handleError(res, err);
  }
  }

  async batchUpdatePermissions(req: Request, res: Response) {
  try {
    const { ids, ...data } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return this.handleError(res, 'ids array required', 400);
    }
    let upserted = 0;
    for (const id of ids) {
      await prisma.permission.upsert({
        where: { id },
        update: data,
        create: { id, ...data },
      });
      upserted++;
    }
    this.sendSuccess(res, { count: upserted });
  } catch (err) {
    this.handleError(res, err);
  }
  }
}

export const permissionController = new PermissionController();
