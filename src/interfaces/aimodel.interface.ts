import { PrismaClient, AIModel as PrismaAIModel } from '@prisma/client';

export type AIModelModel = PrismaClient['aIModel'];

export interface AIModelDro extends Omit<PrismaAIModel, 'id' | 'createdAt' | 'updatedAt'> {}
export interface AIModelDto extends AIModelDro {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
