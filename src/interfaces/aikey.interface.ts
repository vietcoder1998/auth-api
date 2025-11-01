import { PrismaClient, AIKey as PrismaAIKey } from '@prisma/client';

export type AIKeyModel = PrismaClient['aIKey'];

export interface AIKeyDto extends Partial<Omit<AIKeyModel, 'id' | 'createdAt' | 'updatedAt'>> {}
export interface AIKeyDro extends Partial<AIKeyDto> {
    key: string;
}
