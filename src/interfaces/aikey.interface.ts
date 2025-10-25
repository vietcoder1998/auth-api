import { PrismaClient, AIKey as PrismaAIKey } from '@prisma/client';

export type AIKeyModel = PrismaClient['aIKey'];

export interface AIKeyDro extends Omit<PrismaAIKey, 'id' | 'createdAt' | 'updatedAt'> {}
export interface AIKeyDto extends AIKeyDro {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
