import { 
  PermissionGroupDto, 
  PermissionGroupModel, 
  PermissionGroupSearchParams, 
  CreatePermissionGroupData,
  UpdatePermissionGroupData,
  PaginatedPermissionGroupsResponse,
  PermissionsNotInGroupResponse
} from '../interfaces/permissionGroup.interface';
import { BaseService } from './base.service';
import { PermissionGroupRepository } from '../repositories/permissionGroup.repository';

export class PermissionGroupService extends BaseService<
  PermissionGroupModel,
  PermissionGroupDto,
  PermissionGroupDto
> {
  private permissionGroupRepository: PermissionGroupRepository;

  constructor() {
    const permissionGroupRepository = new PermissionGroupRepository();
    super(permissionGroupRepository);
    this.permissionGroupRepository = permissionGroupRepository;
  }

  async getPermissionGroups(
    page: number = 1,
    limit: number = 10,
    search?: string,
    roleId?: string,
    includePermissions: boolean = true,
    includeRole: boolean = true
  ): Promise<PaginatedPermissionGroupsResponse> {
    try {
      const params: PermissionGroupSearchParams = {
        page,
        limit,
        search,
        roleId,
        includePermissions,
        includeRole
      };

      return await this.permissionGroupRepository.findAllWithRelations(params);
    } catch (error) {
      console.error('Error getting permission groups:', error);
      throw new Error('Failed to fetch permission groups');
    }
  }

  async getPermissionGroupById(id: string) {
    try {
      const group = await this.permissionGroupRepository.findWithPermissions(id);
      if (!group) {
        throw new Error('Permission group not found');
      }
      return group;
    } catch (error) {
      console.error('Error getting permission group by ID:', error);
      throw error;
    }
  }

  async createPermissionGroup(data: CreatePermissionGroupData) {
    try {
      // Check if group with this name already exists
      const existingGroup = await this.permissionGroupRepository.findByName(data.name);
      if (existingGroup) {
        throw new Error('Permission group with this name already exists');
      }

      const { permissionIds, ...groupData } = data;
      
      // Create the group first
      const createData: any = {
        ...groupData
      };

      // Connect permissions if provided
      if (permissionIds && permissionIds.length > 0) {
        createData.permissions = {
          connect: permissionIds.map(id => ({ id }))
        };
      }

      const group = await this.permissionGroupRepository.permissionGroupModel.create({
        data: createData,
        include: {
          permissions: true,
          roles: true
        }
      });

      return group;
    } catch (error) {
      console.error('Error creating permission group:', error);
      throw error;
    }
  }

  async updatePermissionGroup(id: string, data: UpdatePermissionGroupData) {
    try {
      const existingGroup = await this.permissionGroupRepository.findById(id);
      if (!existingGroup) {
        throw new Error('Permission group not found');
      }

      // Check name uniqueness if name is being updated
      if (data.name && data.name !== (existingGroup as any).name) {
        const groupWithName = await this.permissionGroupRepository.findByName(data.name);
        if (groupWithName) {
          throw new Error('Permission group with this name already exists');
        }
      }

      const { permissionIds, ...updateData } = data;
      
      let finalUpdateData: any = { ...updateData };

      // Update permissions if provided
      if (permissionIds !== undefined) {
        finalUpdateData.permissions = {
          set: permissionIds.map(id => ({ id }))
        };
      }

      const updatedGroup = await this.permissionGroupRepository.permissionGroupModel.update({
        where: { id },
        data: finalUpdateData,
        include: {
          permissions: true,
          roles: true
        }
      });

      return updatedGroup;
    } catch (error) {
      console.error('Error updating permission group:', error);
      throw error;
    }
  }

  async deletePermissionGroup(id: string) {
    try {
      const existingGroup = await this.permissionGroupRepository.findById(id);
      if (!existingGroup) {
        throw new Error('Permission group not found');
      }

      // First disconnect all permissions
      await this.permissionGroupRepository.permissionGroupModel.update({
        where: { id },
        data: {
          permissions: {
            set: []
          }
        }
      });

      // Then delete the group
      const deletedGroup = await this.permissionGroupRepository.delete(id);
      return deletedGroup;
    } catch (error) {
      console.error('Error deleting permission group:', error);
      throw error;
    }
  }

  async addPermissionsToGroup(groupId: string, permissionIds: string[]) {
    try {
      const group = await this.permissionGroupRepository.findById(groupId);
      if (!group) {
        throw new Error('Permission group not found');
      }

      return await this.permissionGroupRepository.addPermissionsToGroup(groupId, permissionIds);
    } catch (error) {
      console.error('Error adding permissions to group:', error);
      throw error;
    }
  }

  async removePermissionsFromGroup(groupId: string, permissionIds: string[]) {
    try {
      const group = await this.permissionGroupRepository.findById(groupId);
      if (!group) {
        throw new Error('Permission group not found');
      }

      return await this.permissionGroupRepository.removePermissionsFromGroup(groupId, permissionIds);
    } catch (error) {
      console.error('Error removing permissions from group:', error);
      throw error;
    }
  }

  async getPermissionsNotInGroup(
    groupId: string,
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<PermissionsNotInGroupResponse> {
    try {
      const group = await this.permissionGroupRepository.findById(groupId);
      if (!group) {
        throw new Error('Permission group not found');
      }

      return await this.permissionGroupRepository.getPermissionsNotInGroup(groupId, page, limit, search);
    } catch (error) {
      console.error('Error getting permissions not in group:', error);
      throw error;
    }
  }

  // Updated to use new many-to-many methods
  async assignGroupToRole(groupId: string, roleId: string) {
    return this.assignGroupToRoles(groupId, [roleId]);
  }

  async unassignGroupFromRole(groupId: string) {
    return this.unassignGroupFromRoles(groupId);
  }

  async getGroupsByRole(roleId: string) {
    try {
      return await this.permissionGroupRepository.findByRole(roleId);
    } catch (error) {
      console.error('Error getting groups by role:', error);
      throw error;
    }
  }

  // New methods for many-to-many role assignments
  async assignGroupToRoles(groupId: string, roleIds: string[]) {
    try {
      const existingGroup = await this.permissionGroupRepository.findById(groupId);
      if (!existingGroup) {
        throw new Error('Permission group not found');
      }

      return await this.permissionGroupRepository.assignToRoles(groupId, roleIds);
    } catch (error) {
      console.error('Error assigning group to roles:', error);
      throw error;
    }
  }

  async unassignGroupFromRoles(groupId: string, roleIds?: string[]) {
    try {
      const existingGroup = await this.permissionGroupRepository.findById(groupId);
      if (!existingGroup) {
        throw new Error('Permission group not found');
      }

      return await this.permissionGroupRepository.unassignFromRoles(groupId, roleIds);
    } catch (error) {
      console.error('Error unassigning group from roles:', error);
      throw error;
    }
  }

}

// Export an instance
export const permissionGroupService = new PermissionGroupService();