import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Interface for API key request
interface ApiKeyRequest extends Request {
  apiKey?: {
    id: string;
    name: string;
    userId?: string;
    permissions: string[];
    allowedIPs: string[];
    rateLimit: number;
    usageCount: number;
  };
}

// API Key validation middleware
export async function apiKeyValidation(req: ApiKeyRequest, res: Response, next: NextFunction) {
  try {
    // Check for API key in headers
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }

    // Find the API key in database
    const foundApiKey = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: {
        user: {
          select: { id: true, email: true, nickname: true, role: true }
        }
      }
    });

    if (!foundApiKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Check if API key is active
    if (!foundApiKey.isActive) {
      return res.status(401).json({ error: 'API key is disabled' });
    }

    // Check if API key is expired
    if (foundApiKey.expiresAt && new Date() > foundApiKey.expiresAt) {
      return res.status(401).json({ error: 'API key has expired' });
    }

    // Check IP restrictions
    if (foundApiKey.allowedIPs) {
      const allowedIPs = JSON.parse(foundApiKey.allowedIPs);
      const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
      
      if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
        return res.status(403).json({ error: 'IP address not allowed' });
      }
    }

    // Simple rate limiting check (you might want to implement a more sophisticated rate limiter)
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentUsage = await prisma.apiUsageLog.count({
      where: {
        apiKeyId: foundApiKey.id,
        createdAt: { gte: hourAgo }
      }
    });

    // Check rate limit (if set)
    if (foundApiKey.rateLimit && recentUsage >= foundApiKey.rateLimit) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    // Parse permissions
    const permissions = foundApiKey.permissions ? JSON.parse(foundApiKey.permissions) : [];
    const allowedIPs = foundApiKey.allowedIPs ? JSON.parse(foundApiKey.allowedIPs) : [];

    // Attach API key info to request
    req.apiKey = {
      id: foundApiKey.id,
      name: foundApiKey.name,
      userId: foundApiKey.userId || undefined,
      permissions,
      allowedIPs,
      rateLimit: foundApiKey.rateLimit || 0,
      usageCount: foundApiKey.usageCount
    };

    // Also attach user info if API key is associated with a user
    if (foundApiKey.user) {
      req.user = foundApiKey.user as any;
    }

    // Log API usage (async, don't wait for it)
    logApiUsage(req, res, foundApiKey.id).catch(console.error);

    // Update usage count and last used timestamp
    prisma.apiKey.update({
      where: { id: foundApiKey.id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date()
      }
    }).catch(console.error);

    next();
  } catch (error) {
    console.error('API Key validation error:', error);
    res.status(500).json({ error: 'Internal server error during API key validation' });
  }
}

// Log API usage for analytics
async function logApiUsage(req: Request,res: Response, apiKeyId: string) {
  try {
    const startTime = Date.now();
    
    // Store original end method
    const originalEnd = res?.end;
    
    if (originalEnd && res) {
      const originalEndBound = originalEnd.bind(res);

      res.end = function(this: typeof res, chunk?: any, encoding?: any, cb?: any) {
        const responseTime = Date.now() - startTime;
        
        // Log the usage
        prisma.apiUsageLog.create({
          data: {
            apiKeyId,
            endpoint: req.path,
            method: req.method,
            ipAddress: req.ip || req.connection.remoteAddress as string,
            userAgent: req.headers['user-agent'],
            statusCode: res.statusCode || 0,
            responseTime,
            // Only log request/response body in development or for debugging
            requestBody: process.env.NODE_ENV === 'development' ? JSON.stringify(req.body) : null,
            responseBody: process.env.NODE_ENV === 'development' && chunk ? chunk.toString() : null
          }
        }).catch(console.error);

        // Call original end method and return its result
        return originalEndBound(chunk, encoding, cb);
      };
    }
  } catch (error) {
    console.error('Error logging API usage:', error);
  }
}

// Check if API key has specific permission
export function requireApiPermission(permission: string) {
  return (req: ApiKeyRequest, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      return res.status(401).json({ error: 'API key validation required' });
    }

    const hasPermission = req.apiKey.permissions.includes(permission) || 
                         req.apiKey.permissions.includes('*') || // Wildcard permission
                         req.apiKey.permissions.includes('admin'); // Admin permission

    if (!hasPermission) {
      return res.status(403).json({ 
        error: `Insufficient permissions. Required: ${permission}` 
      });
    }

    next();
  };
}