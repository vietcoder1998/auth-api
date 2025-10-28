import { PrismaClient, Permission as PrismaPermission } from '@prisma/client';

export type PermissionModel = PrismaClient['permission'];

export interface PermissionDto extends Omit<PrismaPermission, 'id' | 'createdAt' | 'updatedAt'> {}

export interface PermissionDro extends PermissionDto {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
