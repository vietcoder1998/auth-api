import { PrismaClient } from '@prisma/client';

export type EntityModel = PrismaClient['entity'];

export interface EntityDto extends EntityModel {}
export interface EntityDro extends EntityDto {}