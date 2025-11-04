import { PrismaClient, PermissionGroup, Permission } from '@prisma/client';
import { PermissionDro, PermissionDto } from './permission.interface';
import { RoleDto } from './role.interface';

export type PermissionGroupModel = PrismaClient['permissionGroup'];

export interface PermissionGroupDto extends Omit<PermissionGroup, 'createdAt' | 'updatedAt'> {
  _count?: {
    permissions?: number;
    roles?: number;
  };
  permissions?: PermissionDro[];
  // Many-to-many relationship with roles
  roles?: RoleBasic[];
}

export interface PermissionGroupDro extends PermissionGroupDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Basic role info to avoid circular dependencies
export interface RoleBasic {
  id: string;
  name: string;
  description?: string;
}

export interface CreatePermissionGroupData {
  name: string;
  description?: string;
  // Support both old roleId and new roleIds for backward compatibility
  roleId?: string;
  roleIds?: string[];
  permissionIds?: string[];
}

export interface UpdatePermissionGroupData {
  name?: string;
  description?: string;
  // Support both old roleId and new roleIds for backward compatibility
  roleId?: string;
  roleIds?: string[];
  permissionIds?: string[];
}

export interface PermissionGroupWithRelations extends Partial<Omit<PermissionGroupDto, '_count'>> {
  permissions?: PermissionDro[];
  // Support both old role and new roles for backward compatibility
  role?: RoleDto;
  roles?: RoleBasic[];
  _count?: {
    permissions?: number;
    roles?: number;
  };
}

// New interfaces for many-to-many operations
export interface AssignRolesToGroupRequest {
  roleIds: string[];
}

export interface AssignGroupToRolesRequest {
  permissionGroupIds: string[];
}

export interface RoleGroupAssignment {
  roleId: string;
  permissionGroupId: string;
}

export interface PaginatedPermissionGroupsResponse {
  data: PermissionGroupWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PermissionsNotInGroupResponse {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PermissionGroupSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: string;
  includePermissions?: boolean;
  includeRole?: boolean;
}