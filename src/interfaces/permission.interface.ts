import { PrismaClient, Permission as PrismaPermission } from '@prisma/client';

export type PermissionModel = PrismaClient['permission'];

export interface PermissionDro extends Omit<PrismaPermission, 'id' | 'createdAt' | 'updatedAt'> {}
export interface PermissionDto extends PermissionDro {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
