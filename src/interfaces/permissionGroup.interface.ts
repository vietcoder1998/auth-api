import { PrismaClient, PermissionGroup, Permission } from '@prisma/client';
import { PermissionDro, PermissionDto } from './permission.interface';
import { RoleDto } from './role.interface';

export type PermissionGroupModel = PrismaClient['permissionGroup'];

export interface PermissionGroupDto extends Omit<PermissionGroup, 'createdAt' | 'updatedAt'> {
  _count?: number;
  permissions?: PermissionDro[];
}

export interface PermissionGroupDro extends PermissionGroupDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePermissionGroupData {
  name: string;
  description?: string;
  roleId?: string;
  permissionIds?: string[];
}

export interface UpdatePermissionGroupData {
  name?: string;
  description?: string;
  roleId?: string;
  permissionIds?: string[];
}

export interface PermissionGroupWithRelations extends Partial<Omit<PermissionGroupDto, '_count'>> {
  permissions?: PermissionDro[];
  role?: RoleDto;
  _count?: {
    permissions?: number;
  };
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