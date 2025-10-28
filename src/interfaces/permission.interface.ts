import { PrismaClient } from '@prisma/client';

export type PermissionModel = PrismaClient['permission'];

export interface PermissionDto extends Partial<PermissionModel> {
  name: string;
  route: string | null;
  method: string | null;
  description: string;
  category: string;
}

export interface PermissionDro extends PermissionDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PermissionCreatePayload extends Partial<PermissionDto> {
  route?: string | null;
  method?: string | null;
  description?: string;
  category?: string;
  name?: string;
}
