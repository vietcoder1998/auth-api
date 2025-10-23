import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { client } from '../setup';
import { logger } from './logger.middle';

// Generate cache key from request
export function generateCacheKey(req: Request): string {
  const { method, originalUrl, body, query } = req;
  const data = JSON.stringify({ method, url: originalUrl, body, query });
  return `cache:${crypto.createHash('md5').update(data).digest('hex')}`;
}

// Generate a URL-based cache key for easier pattern matching
export function generateUrlBasedCacheKey(req: Request): string {
  const cleanUrl = req.originalUrl.split('?')[0]; // Remove query params for the pattern
  const queryString = req.originalUrl.includes('?') ? req.originalUrl.split('?')[1] : '';
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify({ method: req.method, body: req.body, query: req.query }))
    .digest('hex')
    .substring(0, 8);

  // Create a key that includes the URL path for pattern matching
  return `cache:url:${cleanUrl.replace(/\//g, ':')}:${hash}${queryString ? ':' + Buffer.from(queryString).toString('base64').substring(0, 8) : ''}`;
}

// Invalidate cache by URL path pattern
export async function invalidateCacheByUrlPattern(urlPath: string): Promise<number> {
  try {
    if (!client.isOpen) {
      logger.info('Redis not connected, skipping cache invalidation');
      return 0;
    }

    // Clean the URL path
    const cleanPath = urlPath.split('?')[0].replace(/\//g, ':');

    // Get all cache keys that match the URL pattern
    const pattern = `cache:url:${cleanPath}*`;
    const matchingKeys = await client.keys(pattern);

    // Also check for parent paths - if we're invalidating /api/admin/conversions/123
    // we should also invalidate /api/admin/conversions
    const pathParts = urlPath.split('/').filter((part) => part.length > 0);
    let allKeysToDelete = [...matchingKeys];

    for (let i = 1; i < pathParts.length; i++) {
      const parentPath = '/' + pathParts.slice(0, i).join('/');
      const parentPattern = `cache:url:${parentPath.replace(/\//g, ':')}*`;
      const parentKeys = await client.keys(parentPattern);
      allKeysToDelete = [...allKeysToDelete, ...parentKeys];
    }

    // Remove duplicates
    const uniqueKeys = [...new Set(allKeysToDelete)];

    if (uniqueKeys.length > 0) {
      await client.del(uniqueKeys);
      logger.info(`Invalidated ${uniqueKeys.length} cache entries for URL pattern: ${urlPath}`);
      return uniqueKeys.length;
    }

    return 0;
  } catch (error) {
    logger.error('Cache invalidation by URL pattern error:', error);
    return 0;
  }
}

// Cache middleware factory
export function cacheMiddleware(
  options: {
    ttl?: number; // Time to live in seconds
    skipCache?: (req: Request) => boolean; // Function to determine if caching should be skipped
    keyGenerator?: (req: Request) => string; // Custom key generator
    useUrlBasedKeys?: boolean; // Use URL-based keys for easier pattern matching
  } = {},
) {
  const {
    ttl = 300, // Default 5 minutes
    skipCache = () => false,
    keyGenerator = generateCacheKey,
    useUrlBasedKeys = true, // Default to true for better cache invalidation
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Handle cache invalidation for non-GET requests
    if (['PUT', 'POST', 'DELETE', 'PATCH'].includes(req.method)) {
      try {
        const urlPath = req.originalUrl.split('?')[0];

        // Invalidate cache for the current path and its parent paths
        // For example: PUT /api/admin/conversions/123 should invalidate:
        // - /api/admin/conversions/123
        // - /api/admin/conversions
        // - /api/admin
        // - /api
        const pathParts = urlPath.split('/').filter((part) => part.length > 0);
        const pathsToInvalidate = [];

        // Add the full path
        pathsToInvalidate.push(urlPath);

        // Add parent paths
        for (let i = pathParts.length - 1; i > 0; i--) {
          const parentPath = '/' + pathParts.slice(0, i).join('/');
          pathsToInvalidate.push(parentPath);
        }

        let totalInvalidated = 0;
        for (const path of pathsToInvalidate) {
          const count = await invalidateCacheByUrlPattern(path);
          totalInvalidated += count;
        }

        if (totalInvalidated > 0) {
          logger.info(`Cache invalidation completed for ${req.method} ${urlPath}`, {
            method: req.method,
            url: urlPath,
            invalidatedPaths: pathsToInvalidate,
            totalInvalidated,
          });
        }
      } catch (error) {
        logger.error('Cache invalidation error:', error);
      }

      return next();
    }

    // Skip caching for non-GET requests or when explicitly skipped
    if (req.method !== 'GET' || skipCache(req)) {
      return next();
    }

    try {
      const cacheKey = useUrlBasedKeys ? generateUrlBasedCacheKey(req) : keyGenerator(req);
      logger.info('Cache middleware processing:', {
        method: req.method,
        url: req.originalUrl,
        cacheKey,
        redisConnected: client.isOpen,
      });

      // Check if Redis is connected
      if (!client.isOpen) {
        console.warn('Redis not connected, skipping cache');
        return next();
      }

      // Try to get cached response
      const cachedResponse = await client.get(cacheKey);

      if (cachedResponse) {
        logger.info('Cache HIT for:', req.originalUrl);
        const { statusCode, data, headers } = JSON.parse(cachedResponse);

        // Set cached headers
        Object.entries(headers).forEach(([key, value]) => {
          res.set(key, value as string);
        });

        // Add cache hit header
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);

        // Handle different data types for cached responses
        let responseData = data;

        // If data is a string that looks like JSON, try to parse it
        if (typeof data === 'string') {
          try {
            const parsedData = JSON.parse(data);
            // If parsed data is an object (but not array), use the parsed value
            if (
              typeof parsedData === 'object' &&
              parsedData !== null &&
              !Array.isArray(parsedData)
            ) {
              responseData = parsedData;
            } else {
              // For arrays or other types, keep original logic (return as string)
              responseData = data;
            }
          } catch {
            // If parsing fails, keep as string
            responseData = data;
          }
        } else {
          // For non-string data, return as is
          responseData = data;
        }

        return res.status(statusCode).json(responseData);
      }

      console.log('Cache MISS for:', req.originalUrl);

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
