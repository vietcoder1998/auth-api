import { PrismaClient, Role as PrismaRole } from '@prisma/client';

export type RoleModel = PrismaClient['role'];

export interface RoleDro extends Omit<PrismaRole, 'id' | 'createdAt' | 'updatedAt'> {}
export interface RoleDto extends RoleDro {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
