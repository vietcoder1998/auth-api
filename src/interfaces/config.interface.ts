import { PrismaClient, Config as PrismaConfig } from '@prisma/client';

export type ConfigModel = PrismaClient['config'];

export interface ConfigDro extends Omit<PrismaConfig, 'id' | 'createdAt' | 'updatedAt'> {}
export interface ConfigDto extends ConfigDro {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
