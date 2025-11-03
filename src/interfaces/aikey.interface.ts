import { PrismaClient, AIKey as PrismaAIKey } from '@prisma/client';

export type AIKeyModel = PrismaClient['aIKey'];

export interface AIKeyDto {
  key: string;
  name: string;
  description?: string;
  userId?: string;
  platformId?: string;
  isActive?: boolean;
  agentIds?: string[]; // For create/update operations
}

export interface AIKeyDro extends Omit<PrismaAIKey, 'createdAt' | 'updatedAt'> {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  platform?: any;
  agents?: any[];
  user?: any;
}
