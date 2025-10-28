import { Request, Response } from 'express';
import { RoleDro, RoleDto, RoleModel } from '../interfaces';
import { ResponseMiddleware } from '../middlewares/response.middleware';
import { roleService, RoleService } from '../services/role.service';
import { BaseController } from './base.controller';

export class RoleController extends BaseController<RoleModel, RoleDto, RoleDro> {
  constructor(roleService: RoleService) {
    super(roleService);
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

      // Call service method
      const result = await roleService.getRoles(
        currentPage,
        currentLimit,
        (q as string) || undefined,
        sortBy as string,
        sortOrder as 'asc' | 'desc'
      );

      // Set pagination metadata for response middleware
      ResponseMiddleware.setPaginationMeta(req, result.total, currentPage, currentLimit);

      // Return paginated response
      this.sendSuccess(res, result.data);
    } catch (err) {
      console.error('Get roles error:', err);
      this.handleError(res, err);
    }
  }

  async createRole(req: Request, res: Response) {
    try {
      const { name, description, permissions } = req.body;

      const role = await roleService.createRole({
        name,
        description,
        permissionIds: permissions,
      });

      this.sendSuccess(res, role);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async updateRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, permissions } = req.body;

      const role = await roleService.updateRole(id, {
        name,
        description,
        permissionIds: permissions,
      });

      this.sendSuccess(res, role);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async deleteRole(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await roleService.deleteRole(id);

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

      // Call service method
      const result = await roleService.getPermissionsNotInRole(
        id,
        currentPage,
        currentLimit,
        (q as string) || undefined,
        sortBy as string,
        sortOrder as 'asc' | 'desc'
      );

      this.sendSuccess(res, { data: result.data, roleInfo: result.roleInfo });
    } catch (err) {
      console.error('Get permissions not in role error:', err);
      this.handleError(res, err);
    }
  }

  async addPermissionsToRole(req: Request, res: Response) {
    try {
      const { id } = req.params; // role id
      const { permissionIds } = req.body;

      const result = await roleService.addPermissionsToRole(id, permissionIds);

      this.sendSuccess(res, result);
    } catch (err) {
      console.error('Add permissions to role error:', err);
      this.handleError(res, err);
    }
  }
}

export const roleController = new RoleController(roleService);
