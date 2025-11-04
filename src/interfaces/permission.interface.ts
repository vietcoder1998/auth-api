import { PrismaClient } from '@prisma/client';

export type PermissionModel = PrismaClient['permission'];

export interface PermissionDto extends Partial<PermissionModel> {
  name: string;
  route: string | null;
  method: string | null;
  description: string;
  category: string;
  // Many-to-many relationship with permission groups
  permissionGroups?: PermissionGroupBasic[];
}

export interface PermissionDro extends PermissionDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Basic permission group info to avoid circular dependencies
export interface PermissionGroupBasic {
  id: string;
  name: string;
  description?: string;
}

export interface PermissionCreatePayload extends Partial<PermissionDto> {
  route?: string | null;
  method?: string | null;
  description?: string;
  category?: string;
  name?: string;
}
