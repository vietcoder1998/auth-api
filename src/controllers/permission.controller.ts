import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { logInfo, logError } from '../middlewares/logger.middle';
import { ResponseMiddleware } from '../middlewares/response.middleware';
import { permissionService } from '../services/permission.service';
import { PermissionDto, PermissionModel } from '../interfaces';

const prisma = new PrismaClient();

export class PermissionController extends BaseController<PermissionModel, PermissionDto, PermissionDto> {
  constructor() {
    super(permissionService);
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
    } = req.query;

    // Parse pagination parameters
    const currentPage = Math.max(1, parseInt(page as string, 10));
    const currentLimit = Math.max(1, Math.min(100, parseInt(pageSize as string, 10)));

    // Use permission service to get permissions
    const result = await permissionService.getPermissions(
      currentPage, 
      currentLimit, 
      q as string, 
      category as string
    );

    // Set pagination metadata for response middleware
    ResponseMiddleware.setPaginationMeta(req, result.total, currentPage, currentLimit);

    // Return paginated response
    this.sendSuccess(res, result);
  } catch (err) {
    logError('Failed to fetch permissions:', err);
    this.handleError(res, err);
  }
  }

  async createPermission(req: Request, res: Response) {
  try {
    // Use permission service to create permission
    const permission = await permissionService.createPermission(req.body as PermissionDto);

    logInfo(`Permission '${permission?.name}' created successfully`);
    this.sendSuccess(res, permission, 'Permission created successfully', 201);
  } catch (err) {
    logError('Failed to create/update permission:', err);
    this.handleError(res, err);
  }
  }

  async updatePermission(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description, category, route, method } = req.body;
  try {
    const permission = await permissionService.updatePermission(id, {
      name,
      description,
      category,
      route,
      method,
    });
    this.sendSuccess(res, permission);
  } catch (err) {
    this.handleError(res, err);
  }
  }

  async deletePermission(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await permissionService.deletePermission(id);
    this.sendSuccess(res, null, 'Permission deleted successfully');
  } catch (err) {
    this.handleError(res, err);
  }
  }

  async createPermissionWithSuperadmin(req: Request, res: Response) {
  const { name, description, category, route, method } = req.body;

    if (!name) {
      return this.handleError(res, 'Permission name is required', 400);
    }
    
  try {
    // Use permission service to create permission
    const permission = await permissionService.createPermission({
      name,
      description,
      category,
      route,
      method,
    }) as any;

    // Add to superadmin role using Prisma directly for now
    // TODO: Move this logic to permission service
    const superadminRole = await prisma.role.findUnique({
      where: { name: 'superadmin' },
    });

    if (superadminRole) {
      await prisma.role.update({
        where: { id: superadminRole.id },
        data: {
          permissions: {
            connect: { id: permission.id },
          },
        },
      });
    }

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
    }, 'Permission created successfully', 201);
  } catch (err) {
    logError('Failed to create permission with superadmin:', err);
    this.handleError(res, err);
  }
  }

  async addPermissionToSuperadmin(req: Request, res: Response) {
  const { permissionId } = req.params;

  try {
    // Get the permission using service
    const permission = await permissionService.getPermissionById(permissionId);

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

    // Add permission to superladmin role
    await prisma.role.update({
      where: { id: superadminRole.id },
      data: {
        permissions: {
          connect: { id: permissionId },
        },
      },
    });

    logInfo(`Permission '${(permission as any).name}' added to superadmin role`, {
      permissionId: (permission as any).id,
      permissionName: (permission as any).name,
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
