import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { client } from '../setup';

// Generate cache key from request
function generateCacheKey(req: Request): string {
  const { method, originalUrl, body, query } = req;
  const data = JSON.stringify({ method, url: originalUrl, body, query });
  return `cache:${crypto.createHash('md5').update(data).digest('hex')}`;
}

// Cache middleware factory
export function cacheMiddleware(
  options: {
    ttl?: number; // Time to live in seconds
    skipCache?: (req: Request) => boolean; // Function to determine if caching should be skipped
    keyGenerator?: (req: Request) => string; // Custom key generator
  } = {},
) {
  const {
    ttl = 300, // Default 5 minutes
    skipCache = () => false,
    keyGenerator = generateCacheKey,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests, cache API endpoints, or when explicitly skipped
    if (req.method !== 'GET' || req.originalUrl.includes('/cache') || skipCache(req)) {
      return next();
    }

    try {
      const cacheKey = keyGenerator(req);

      // Try to get cached response
      const cachedResponse = await client.get(cacheKey);

      if (cachedResponse) {
        const { statusCode, data, headers } = JSON.parse(cachedResponse);

        // Set cached headers
        Object.entries(headers).forEach(([key, value]) => {
          res.set(key, value as string);
        });

        // Add cache hit header
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);

        return res.status(statusCode).json(data);
      }

      // Cache miss - intercept response
      const originalSend = res.send;
      const originalJson = res.json;

      res.json = function (body: any) {
        // Cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const responseData = {
            statusCode: res.statusCode,
            data: body,
            headers: res.getHeaders(),
          };

          // Store in cache asynchronously
          client
            .setEx(cacheKey, ttl, JSON.stringify(responseData))
            .catch((err: any) => console.error('Cache set error:', err));
        }

        // Add cache miss header
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', cacheKey);

        return originalJson.call(this, body);
      };

      res.send = function (body: any) {
        // Cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const responseData = {
            statusCode: res.statusCode,
            data: body,
            headers: res.getHeaders(),
          };

          // Store in cache asynchronously
          client
            .setEx(cacheKey, ttl, JSON.stringify(responseData))
            .catch((err: any) => console.error('Cache set error:', err));
        }

        // Add cache miss header
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', cacheKey);

        return originalSend.call(this, body);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      // Continue without caching on error
      next();
    }
  };
}

// Cache invalidation utility
export async function invalidateCache(pattern: string = '*') {
  try {
    const keys = await client.keys(`cache:${pattern}`);

    if (keys.length > 0) {
      await client.del(keys);
      console.log(`Invalidated ${keys.length} cache entries`);
    }

    return keys.length;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return 0;
  }
}

// Cache statistics
export async function getCacheStats() {
  try {
    const info = await client.info('memory');
    const keys = await client.keys('cache:*');

    return {
      totalKeys: keys.length,
      memoryInfo: info,
      connected: client.isOpen,
    };
  } catch (error) {
    console.error('Cache stats error:', error);
    return {
      totalKeys: 0,
      memoryInfo: '',
      connected: false,
      error:
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message: string }).message
          : String(error),
    };
  }
}
