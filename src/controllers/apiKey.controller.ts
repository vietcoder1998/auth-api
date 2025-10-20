import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Generate a secure API key
function generateApiKey(prefix: string = 'ak'): string {
  const randomBytes = crypto.randomBytes(32);
  return `${prefix}_${randomBytes.toString('hex')}`;
}

// Get all API keys (admin only)
export async function getApiKeys(req: Request, res: Response) {
  try {
    // Extract query parameters
    const {
      page = '1',
      limit = '10',
      pageSize = limit,
      search = '',
      q = search,
      status,
      userId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Parse pagination parameters
    const currentPage = Math.max(1, parseInt(page as string, 10));
    const currentLimit = Math.max(1, Math.min(100, parseInt(pageSize as string, 10)));
    const skip = (currentPage - 1) * currentLimit;

    // Build where clause for search and filters
    const whereClause: any = {};

    // Search across multiple fields
    if (q && typeof q === 'string' && q.trim()) {
      const searchTerm = q.trim();
      whereClause.OR = [
        { name: { contains: searchTerm } },
        { description: { contains: searchTerm } },
      ];
    }

    // Status filter
    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }

    // User filter
    if (userId && typeof userId === 'string') {
      whereClause.userId = userId;
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'updatedAt') {
      orderBy.updatedAt = sortOrder;
    } else {
      orderBy.createdAt = 'desc'; // Default
    }

    // Get total count for pagination
    const total = await prisma.apiKey.count({ where: whereClause });

    // Get API keys with pagination
    const apiKeys = await prisma.apiKey.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, email: true, nickname: true },
        },
        _count: {
          select: { apiUsageLogs: true },
        },
      },
      orderBy,
      skip,
      take: currentLimit,
    });

    // Hide the actual API keys in the response for security
    const sanitizedApiKeys = apiKeys.map((apiKey) => ({
      ...apiKey,
      key: `${apiKey.key.substring(0, 8)}...${apiKey.key.substring(apiKey.key.length - 4)}`,
    }));

    res.json({
      data: sanitizedApiKeys,
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit),
    });
  } catch (err) {
    console.error('Get API keys error:', err);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
}

// Create new API key
export async function createApiKey(req: Request, res: Response) {
  try {
    const {
      name,
      description,
      permissions = [],
      allowedIPs = [],
      rateLimit = 1000,
      expiresAt,
      userId,
    } = req.body;

    const currentUser = req.user;
    const apiKey = generateApiKey();

    const newApiKey = await prisma.apiKey.create({
      data: {
        name,
        key: apiKey,
        description,
        permissions: JSON.stringify(permissions),
        allowedIPs: JSON.stringify(allowedIPs),
        rateLimit,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        userId: userId || currentUser?.id,
        createdBy: currentUser?.id,
      },
      include: {
        user: {
          select: { id: true, email: true, nickname: true },
        },
      },
    });

    res.status(201).json({
      ...newApiKey,
      // Return the full key only on creation
      message:
        'API key created successfully. Please save the key securely as it will not be shown again.',
    });
  } catch (err) {
    console.error('Create API key error:', err);
    res.status(500).json({ error: 'Failed to create API key' });
  }
}

// Update API key
export async function updateApiKey(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, permissions, allowedIPs, rateLimit, isActive, expiresAt } = req.body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (permissions !== undefined) updateData.permissions = JSON.stringify(permissions);
    if (allowedIPs !== undefined) updateData.allowedIPs = JSON.stringify(allowedIPs);
    if (rateLimit !== undefined) updateData.rateLimit = rateLimit;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const updatedApiKey = await prisma.apiKey.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, email: true, nickname: true },
        },
      },
    });

    // Hide the API key in response
    const sanitizedApiKey = {
      ...updatedApiKey,
      key: `${updatedApiKey.key.substring(0, 8)}...${updatedApiKey.key.substring(updatedApiKey.key.length - 4)}`,
    };

    res.json(sanitizedApiKey);
  } catch (err) {
    console.error('Update API key error:', err);
    res.status(500).json({ error: 'Failed to update API key' });
  }
}

// Regenerate API key
export async function regenerateApiKey(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const newApiKey = generateApiKey();

    const updatedApiKey = await prisma.apiKey.update({
      where: { id },
      data: {
        key: newApiKey,
        usageCount: 0, // Reset usage count
        lastUsedAt: null,
      },
      include: {
        user: {
          select: { id: true, email: true, nickname: true },
        },
      },
    });

    res.json({
      ...updatedApiKey,
      message: 'API key regenerated successfully. Please save the new key securely.',
    });
  } catch (err) {
    console.error('Regenerate API key error:', err);
    res.status(500).json({ error: 'Failed to regenerate API key' });
  }
}

// Delete API key
export async function deleteApiKey(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await prisma.apiKey.delete({
      where: { id },
    });

    res.json({ message: 'API key deleted successfully' });
  } catch (err) {
    console.error('Delete API key error:', err);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
}

// Get overall API key usage statistics
export async function getApiKeyStats(req: Request, res: Response) {
  try {
    const { days = 30 } = req.query;
    const daysNum = parseInt(days as string);

    const since = new Date();
    since.setDate(since.getDate() - daysNum);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalKeys, activeKeys, expiredKeys, totalRequests, requestsToday, avgResponseTime] =
      await Promise.all([
        prisma.apiKey.count(),
        prisma.apiKey.count({ where: { isActive: true } }),
        prisma.apiKey.count({
          where: {
            OR: [{ isActive: false }, { expiresAt: { lt: new Date() } }],
          },
        }),
        prisma.apiUsageLog.count({ where: { createdAt: { gte: since } } }),
        prisma.apiUsageLog.count({ where: { createdAt: { gte: today } } }),
        prisma.apiUsageLog.aggregate({
          where: { createdAt: { gte: since } },
          _avg: { responseTime: true },
        }),
      ]);

    res.json({
      totalKeys,
      activeKeys,
      expiredKeys,
      totalRequests,
      requestsToday,
      averageResponseTime: Math.round(avgResponseTime._avg.responseTime || 0),
    });
  } catch (err) {
    console.error('Get API key stats error:', err);
    res.status(500).json({ error: 'Failed to fetch API key statistics' });
  }
}

// Get specific API key usage statistics
export async function getSpecificApiKeyStats(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;
    const daysNum = parseInt(days as string);

    const since = new Date();
    since.setDate(since.getDate() - daysNum);

    const [apiKey, usageLogs, totalRequests, recentActivity] = await Promise.all([
      prisma.apiKey.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          usageCount: true,
          lastUsedAt: true,
          rateLimit: true,
          createdAt: true,
        },
      }),
      prisma.apiUsageLog.findMany({
        where: {
          apiKeyId: id,
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.apiUsageLog.count({
        where: {
          apiKeyId: id,
          createdAt: { gte: since },
        },
      }),
      prisma.apiUsageLog.groupBy({
        by: ['statusCode'],
        where: {
          apiKeyId: id,
          createdAt: { gte: since },
        },
        _count: { id: true },
      }),
    ]);

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Group usage by day
    const dailyUsage = usageLogs.reduce((acc: any, log) => {
      const date = log.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    res.json({
      apiKey,
      totalRequests,
      dailyUsage,
      statusCodeDistribution: recentActivity,
      recentLogs: usageLogs.slice(0, 20), // Latest 20 logs
    });
  } catch (err) {
    console.error('Get specific API key stats error:', err);
    res.status(500).json({ error: 'Failed to fetch API key statistics' });
  }
}

// Get API key usage logs
export async function getApiKeyLogs(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      prisma.apiUsageLog.findMany({
        where: { apiKeyId: id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.apiUsageLog.count({ where: { apiKeyId: id } }),
    ]);

    res.json({
      data: logs,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error('Get API key logs error:', err);
    res.status(500).json({ error: 'Failed to fetch API key logs' });
  }
}
