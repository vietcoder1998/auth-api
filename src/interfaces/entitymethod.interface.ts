import { PrismaClient } from '@prisma/client';

export type EntityMethodModel = PrismaClient['entityMethod'];

export interface EntityMethodDto extends EntityMethodModel {}
export interface EntityMethodDro extends EntityMethodDto {}