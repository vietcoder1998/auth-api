import { PrismaClient, AIModel as PrismaAIModel } from '@prisma/client';

export type AIModel = PrismaClient['aIModel'];
export type AIModelModel = AIModel;

export interface AIModelDto {
  name: string;
  description?: string;
  type: string;
  platformId?: string;
  agentIds?: string[];
}

export interface AIModelDro extends Omit<PrismaAIModel, 'createdAt' | 'updatedAt'> {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  agents?: any[];
  platform?: any;
}
