import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { BaseService } from './base.service';
import { ApiKeyRepository } from '../repositories/apikey.repository';
import { ApiKeyDto } from '../interfaces';

const prisma = new PrismaClient();

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

export class ApiKeyService extends BaseService<any, ApiKeyDto, ApiKeyDto> {
  private apiKeyRepository: ApiKeyRepository;

  constructor() {
    const apiKeyRepository = new ApiKeyRepository();
    super(apiKeyRepository);
    this.apiKeyRepository = apiKeyRepository;
  }

  private generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async createApiKey(data: CreateApiKeyData) {
    const { name, description, userId, permissions, allowedIPs, rateLimit, expiresAt, createdBy } = data;
    const key = this.generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key,
        description,
        userId,
        permissions: permissions ? JSON.stringify(permissions) : null,
        allowedIPs: allowedIPs ? JSON.stringify(allowedIPs) : null,
        rateLimit: rateLimit || 1000,
        expiresAt,
        createdBy,
      },
      include: {
        user: { select: { id: true, email: true, nickname: true } },
      },
    });

    return {
      ...apiKey,
      permissions: apiKey.permissions ? JSON.parse(apiKey.permissions) : null,
      allowedIPs: apiKey.allowedIPs ? JSON.parse(apiKey.allowedIPs) : null,
    };
  }

  async getApiKeyById(id: string) {
    const apiKey = await this.apiKeyRepository.findById(id);
    if (!apiKey) throw new Error('API key not found');

    return prisma.apiKey.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, nickname: true } },
        _count: { select: { apiUsageLogs: true } },
      },
    }).then(key => key ? {
      ...key,
      key: `${key.key.substring(0, 8)}...`,
      permissions: key.permissions ? JSON.parse(key.permissions) : null,
      allowedIPs: key.allowedIPs ? JSON.parse(key.allowedIPs) : null,
    } : null);
  }

  async getApiKeyByKey(key: string) {
    const apiKey = await this.apiKeyRepository.findByKey(key);
    if (!apiKey) return null;

    return {
      ...apiKey,
      permissions: (apiKey as any).permissions ? JSON.parse((apiKey as any).permissions) : null,
      allowedIPs: (apiKey as any).allowedIPs ? JSON.parse((apiKey as any).allowedIPs) : null,
    };
  }

  async updateApiKey(id: string, data: UpdateApiKeyData) {
    const updateData: any = { ...data };
    if (data.permissions) updateData.permissions = JSON.stringify(data.permissions);
    if (data.allowedIPs) updateData.allowedIPs = JSON.stringify(data.allowedIPs);

    const apiKey = await this.apiKeyRepository.update(id, updateData);
    
    return prisma.apiKey.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, nickname: true } } },
    }).then(key => key ? {
      ...key,
      key: `${key.key.substring(0, 8)}...`,
      permissions: key.permissions ? JSON.parse(key.permissions) : null,
      allowedIPs: key.allowedIPs ? JSON.parse(key.allowedIPs) : null,
    } : null);
  }

  async deleteApiKey(id: string) {
    return await this.apiKeyRepository.delete(id);
  }

  async getApiKeys(page: number = 1, limit: number = 20, userId?: string, search?: string, isActive?: boolean) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (userId) where.userId = userId;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) where.OR = [{ name: { contains: search } }, { description: { contains: search } }];

    const [apiKeys, total] = await Promise.all([
      prisma.apiKey.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, email: true, nickname: true } },
          _count: { select: { apiUsageLogs: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.apiKey.count({ where }),
    ]);

    return {
      data: apiKeys.map(key => ({
        ...key,
        key: `${key.key.substring(0, 8)}...`,
        permissions: key.permissions ? JSON.parse(key.permissions) : null,
        allowedIPs: key.allowedIPs ? JSON.parse(key.allowedIPs) : null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async validateApiKey(key: string, endpoint?: string, method?: string, ipAddress?: string): Promise<{
    isValid: boolean;
    apiKey?: any;
    reason?: string;
  }> {
    const apiKey = await this.getApiKeyByKey(key);
    if (!apiKey) return { isValid: false, reason: 'Invalid API key' };
    if (!apiKey.isActive) return { isValid: false, reason: 'API key is inactive' };
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) return { isValid: false, reason: 'API key has expired' };

    if (apiKey.allowedIPs && apiKey.allowedIPs.length > 0 && ipAddress) {
      if (!apiKey.allowedIPs.includes(ipAddress)) return { isValid: false, reason: 'IP address not allowed' };
    }

    if (endpoint && apiKey.permissions && apiKey.permissions.length > 0) {
      const hasPermission = apiKey.permissions.some((permission: string) => endpoint.includes(permission) || permission === '*');
      if (!hasPermission) return { isValid: false, reason: 'Insufficient permissions' };
    }

    await this.updateApiKeyUsage(apiKey.id);
    return { isValid: true, apiKey };
  }

  private async updateApiKeyUsage(id: string) {
    await prisma.apiKey.update({
      where: { id },
      data: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
    });
  }

  async logApiUsage(data: ApiUsageLogData) {
    return await prisma.apiUsageLog.create({ data });
  }

  async getApiUsageLogs(apiKeyId?: string, page: number = 1, limit: number = 50, endpoint?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (apiKeyId) where.apiKeyId = apiKeyId;
    if (endpoint) where.endpoint = { contains: endpoint };

    const [logs, total] = await Promise.all([
      prisma.apiUsageLog.findMany({
        where,
        skip,
        take: limit,
        include: { apiKey: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.apiUsageLog.count({ where }),
    ]);

    return { data: logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getApiKeyStats(apiKeyId?: string) {
    const where = apiKeyId ? { apiKeyId } : {};

    const [totalRequests, statusStats, endpointStats, recentActivity] = await Promise.all([
      prisma.apiUsageLog.count({ where }),
      prisma.apiUsageLog.groupBy({
        by: ['statusCode'],
        where,
        _count: { statusCode: true },
        orderBy: { statusCode: 'asc' },
      }),
      prisma.apiUsageLog.groupBy({
        by: ['endpoint'],
        where,
        _count: { endpoint: true },
        orderBy: { _count: { endpoint: 'desc' } },
        take: 10,
      }),
      prisma.apiUsageLog.findMany({
        where,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { endpoint: true, method: true, statusCode: true, createdAt: true },
      }),
    ]);

    return {
      totalRequests,
      statusStats: statusStats.map(stat => ({ statusCode: stat.statusCode, count: stat._count.statusCode })),
      topEndpoints: endpointStats.map(stat => ({ endpoint: stat.endpoint, count: stat._count.endpoint })),
      recentActivity,
    };
  }

  async regenerateApiKey(id: string) {
    const newKey = this.generateApiKey();
    const apiKey = await prisma.apiKey.update({
      where: { id },
      data: { key: newKey, usageCount: 0, lastUsedAt: null },
      include: { user: { select: { id: true, email: true, nickname: true } } },
    });

    return {
      ...apiKey,
      permissions: apiKey.permissions ? JSON.parse(apiKey.permissions) : null,
      allowedIPs: apiKey.allowedIPs ? JSON.parse(apiKey.allowedIPs) : null,
    };
  }
}

export const apiKeyService = new ApiKeyService();
