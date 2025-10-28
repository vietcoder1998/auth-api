import { PrismaClient, Role } from '@prisma/client';
import { PermissionDro, PermissionDto } from './permission.interface';
import { UserDto } from './user.interface';

export type RoleModel = PrismaClient['role'];

export interface RoleDto extends Omit<Role, 'id' | 'createdAt' | 'updatedAt'> {
  permissions?: PermissionDto[];
}
export interface RoleDro extends RoleDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}


export interface CreateRoleData {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export interface RoleWithRelations extends RoleDro {
  permissions?: PermissionDro[];
  users?: UserDto[];
  _count?: {
    permissions?: number;
    users?: number;
  };
}

export interface PaginatedRolesResponse {
  data: RoleWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PermissionsNotInRoleResponse {
  data: PermissionDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  roleInfo: {
    id: string;
    name: string;
    description: string | null;
    currentPermissionsCount: number;
  };
}

export interface AddPermissionsResponse {
  message: string;
  role: RoleWithRelations | null;
  addedPermissionsCount: number;
  totalPermissionsCount: number;
}

export interface PaginatedUsersResponse {
  data: Array<{
    id: string;
    email: string;
    nickname: string | null;
    status: string;
    createdAt: Date;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
