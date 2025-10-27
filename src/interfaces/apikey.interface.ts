import { PrismaClient, ApiKey as PrismaApiKey } from '@prisma/client';

export type ApiKeyModel = PrismaClient['apiKey'];

export interface ApiKeyDro extends Omit<PrismaApiKey, 'id' | 'createdAt' | 'updatedAt'> {}
export interface ApiKeyDto extends ApiKeyDro {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
