import { Request, Response } from 'express';
import { 
  PermissionGroupDto, 
  PermissionGroupModel, 
  CreatePermissionGroupData,
  UpdatePermissionGroupData
} from '../interfaces/permissionGroup.interface';
import { logError, logInfo } from '../middlewares/logger.middle';
import { permissionGroupService } from '../services/permissionGroup.service';
import { BaseController } from './base.controller';

export class PermissionGroupController extends BaseController<
  PermissionGroupModel,
  PermissionGroupDto,
  PermissionGroupDto
> {
  constructor() {
    super(permissionGroupService);
  }

  async getPermissionGroups(req: Request, res: Response) {
    try {
      // Extract query parameters
      const {
        page = '1',
        limit = '10',
        pageSize = limit,
        search = '',
        q = search,
        roleId,
        includePermissions = 'true',
        includeRole = 'true'
      } = req.query;

      // Parse pagination parameters
      const currentPage = Math.max(1, parseInt(page as string, 10));
      const currentLimit = Math.max(1, Math.min(100, parseInt(pageSize as string, 10)));

      // Use permission group service to get groups
      const result = await permissionGroupService.getPermissionGroups(
        currentPage,
        currentLimit,
        q as string,
        roleId as string,
        includePermissions === 'true',
        includeRole === 'true'
      );

      logInfo('Permission groups retrieved successfully');
      this.sendSuccess(res, result, 'Permission groups retrieved successfully');
    } catch (error) {
      logError('Error getting permission groups:', error);
      this.handleError(res, error);
    }
  }

  async getPermissionGroupById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const group = await permissionGroupService.getPermissionGroupById(id);
      
      logInfo(`Permission group ${id} retrieved successfully`);
      this.sendSuccess(res, group, 'Permission group retrieved successfully');
    } catch (error) {
      logError('Error getting permission group by ID:', error);
      this.handleError(res, error);
    }
  }

  async createPermissionGroup(req: Request, res: Response) {
    try {
      const data: CreatePermissionGroupData = req.body;

      // Validate required fields
      if (!data.name) {
        return this.handleError(res, 'Name is required', 400);
      }

      const group = await permissionGroupService.createPermissionGroup(data);
      
      logInfo(`Permission group created successfully: ${group.name}`);
      this.sendSuccess(res, group, 'Permission group created successfully', 201);
    } catch (error) {
      logError('Error creating permission group:', error);
      this.handleError(res, error);
    }
  }

  async updatePermissionGroup(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdatePermissionGroupData = req.body;

      const updatedGroup = await permissionGroupService.updatePermissionGroup(id, data);
      
      logInfo(`Permission group ${id} updated successfully`);
      this.sendSuccess(res, updatedGroup, 'Permission group updated successfully');
    } catch (error) {
      logError('Error updating permission group:', error);
      this.handleError(res, error);
    }
  }

  async deletePermissionGroup(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      await permissionGroupService.deletePermissionGroup(id);
      
      logInfo(`Permission group ${id} deleted successfully`);
      this.sendSuccess(res, { id }, 'Permission group deleted successfully');
    } catch (error) {
      logError('Error deleting permission group:', error);
      this.handleError(res, error);
    }
  }

  async addPermissionsToGroup(req: Request, res: Response) {
    try {
      const { id: groupId } = req.params;
      const { permissionIds } = req.body;

      if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
        return this.handleError(res, 'Permission IDs are required', 400);
      }

      const updatedGroup = await permissionGroupService.addPermissionsToGroup(groupId, permissionIds);
      
      logInfo(`Permissions added to group ${groupId} successfully`);
      this.sendSuccess(res, updatedGroup, 'Permissions added to group successfully');
    } catch (error) {
      logError('Error adding permissions to group:', error);
      this.handleError(res, error);
    }
  }

  async removePermissionsFromGroup(req: Request, res: Response) {
    try {
      const { id: groupId } = req.params;
      const { permissionIds } = req.body;

      if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
        return this.handleError(res, 'Permission IDs are required', 400);
      }

      const updatedGroup = await permissionGroupService.removePermissionsFromGroup(groupId, permissionIds);
      
      logInfo(`Permissions removed from group ${groupId} successfully`);
      this.sendSuccess(res, updatedGroup, 'Permissions removed from group successfully');
    } catch (error) {
      logError('Error removing permissions from group:', error);
      this.handleError(res, error);
    }
  }

  async getPermissionsNotInGroup(req: Request, res: Response) {
    try {
      const { id: groupId } = req.params;
      const {
        page = '1',
        limit = '10',
        pageSize = limit,
        search = '',
        q = search
      } = req.query;

      // Parse pagination parameters
      const currentPage = Math.max(1, parseInt(page as string, 10));
      const currentLimit = Math.max(1, Math.min(100, parseInt(pageSize as string, 10)));

      const result = await permissionGroupService.getPermissionsNotInGroup(
        groupId,
        currentPage,
        currentLimit,
        q as string
      );

      logInfo(`Available permissions for group ${groupId} retrieved successfully`);
      this.sendSuccess(res, result, 'Available permissions retrieved successfully');
    } catch (error) {
      logError('Error getting available permissions:', error);
      this.handleError(res, error);
    }
  }

  async assignGroupToRole(req: Request, res: Response) {
    try {
      const { id: groupId } = req.params;
      const { roleId } = req.body;

      if (!roleId) {
        return this.handleError(res, 'Role ID is required', 400);
      }

      const updatedGroup = await permissionGroupService.assignGroupToRole(groupId, roleId);
      
      logInfo(`Group ${groupId} assigned to role ${roleId} successfully`);
      this.sendSuccess(res, updatedGroup, 'Group assigned to role successfully');
    } catch (error) {
      logError('Error assigning group to role:', error);
      this.handleError(res, error);
    }
  }

  async unassignGroupFromRole(req: Request, res: Response) {
    try {
      const { id: groupId } = req.params;
      
      const updatedGroup = await permissionGroupService.unassignGroupFromRole(groupId);
      
      logInfo(`Group ${groupId} unassigned from role successfully`);
      this.sendSuccess(res, updatedGroup, 'Group unassigned from role successfully');
    } catch (error) {
      logError('Error unassigning group from role:', error);
      this.handleError(res, error);
    }
  }

  async getGroupsByRole(req: Request, res: Response) {
    try {
      const { roleId } = req.params;
      
      const groups = await permissionGroupService.getGroupsByRole(roleId);
      
      logInfo(`Groups for role ${roleId} retrieved successfully`);
      this.sendSuccess(res, groups, 'Groups retrieved successfully');
    } catch (error) {
      logError('Error getting groups by role:', error);
      this.handleError(res, error);
    }
  }
}

// Export an instance
export const permissionGroupController = new PermissionGroupController();