import { PrismaClient, ApiKey as PrismaApiKey } from '@prisma/client';

export type ApiKeyModel = PrismaClient['apiKey'];

export interface ApiKeyDro extends Omit<PrismaApiKey, 'id' | 'createdAt' | 'updatedAt'> {}
export interface ApiKeyDto extends ApiKeyDro {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    key: string;
}


export interface CreateApiKeyData {
  name: string;
  description?: string;
  userId?: string;
  permissions?: string[];
  allowedIPs?: string[];
  rateLimit?: number;
  expiresAt?: Date;
  createdBy?: string;
}

export interface UpdateApiKeyData {
  name?: string;
  description?: string;
  permissions?: string[];
  allowedIPs?: string[];
  rateLimit?: number;
  isActive?: boolean;
  expiresAt?: Date;
}

export interface ApiUsageLogData {
  apiKeyId: string;
  endpoint: string;
  method: string;
  ipAddress?: string;
  userAgent?: string;
  statusCode: number;
  responseTime?: number;
  requestBody?: string;
  responseBody?: string;
}
