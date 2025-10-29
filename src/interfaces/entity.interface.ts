import { PrismaClient } from '@prisma/client';

export type EntityModel = PrismaClient['entity'];

export interface EntityDto extends Partial<EntityModel> {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface EntityDro extends EntityDto {}