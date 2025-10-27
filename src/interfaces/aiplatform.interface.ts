import { PrismaClient, AIPlatform as PrismaAIPlatform } from '@prisma/client';

export type AIPlatformModel = PrismaClient['aIPlatform'];

export interface AIPlatformDro extends Omit<PrismaAIPlatform, 'id' | 'createdAt' | 'updatedAt'> {}
export interface AIPlatformDto extends AIPlatformDro {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
