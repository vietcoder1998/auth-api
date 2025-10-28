import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { client } from '../setup';
import { logger } from './logger.middle';

// Cache middleware class
export class CacheMiddleware {
  private ttl: number;
  private skipCache: (req: Request) => boolean;
  private keyGenerator: (req: Request) => string;
  private useUrlBasedKeys: boolean;

  constructor(
    options: {
      ttl?: number; // Time to live in seconds
      skipCache?: (req: Request) => boolean; // Function to determine if caching should be skipped
      keyGenerator?: (req: Request) => string; // Custom key generator
      useUrlBasedKeys?: boolean; // Use URL-based keys for easier pattern matching
    } = {},
  ) {
    this.ttl = options.ttl ?? 300; // Default 5 minutes
    this.skipCache = options.skipCache ?? (() => false);
    this.keyGenerator = options.keyGenerator ?? CacheMiddleware.generateCacheKey;
    this.useUrlBasedKeys = options.useUrlBasedKeys ?? true; // Default to true for better cache invalidation
  }

  // Generate cache key from request
  static generateCacheKey(req: Request): string {
    const { method, originalUrl, body, query } = req;
    const data = JSON.stringify({ method, url: originalUrl, body, query });
    return `cache:${crypto.createHash('md5').update(data).digest('hex')}`;
  }

  // Generate a URL-based cache key for easier pattern matching
  static generateUrlBasedCacheKey(req: Request): string {
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
  static async invalidateCacheByUrlPattern(urlPath: string): Promise<number> {
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

  // Cache invalidation utility
  static async invalidateCache(pattern: string = '*') {
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
  static async getCacheStats() {
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

  // Helper method to generate cache invalidation paths
  private generateInvalidationPaths(urlPath: string): string[] {
    const pathParts = urlPath.split('/').filter((part) => part.length > 0);
    const paths = [urlPath]; // Start with full path

    // Add parent paths
    for (let i = pathParts.length - 1; i > 0; i--) {
      paths.push('/' + pathParts.slice(0, i).join('/'));
    }

    return paths;
  }

  // Handle cache invalidation for write operations
  private async handleCacheInvalidation(req: Request): Promise<void> {
    try {
      const urlPath = req.originalUrl.split('?')[0];
      const pathsToInvalidate = this.generateInvalidationPaths(urlPath);

      const totalInvalidated = await Promise.all(
        pathsToInvalidate.map(path => CacheMiddleware.invalidateCacheByUrlPattern(path))
      ).then(counts => counts.reduce((sum, count) => sum + count, 0));

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
  }

  // Process cached response data
  private processResponseData(data: any): any {
    let responseData = data;

    // Try to parse string data as JSON for objects only
    if (typeof data === 'string') {
      try {
        const parsedData = JSON.parse(data);
        responseData = (typeof parsedData === 'object' && parsedData !== null && !Array.isArray(parsedData)) 
          ? parsedData 
          : data;
      } catch {
        responseData = data;
      }
    }

    // Don't modify the original data to avoid circular references or data mutation
    return responseData;
  }

  // Handle cache hit scenario
  private handleCacheHit(res: Response, cachedResponse: string, cacheKey: string): Response {
    const { statusCode, data, headers } = JSON.parse(cachedResponse);

    // Set headers efficiently
    Object.entries(headers).forEach(([key, value]) => res.set(key, value as string));
    res.set('X-Cache', 'HIT').set('X-Cache-Key', cacheKey);

    logger.info('Cache HIT for:', res.req.originalUrl);
    
    const processedData = this.processResponseData(data);
    return res.status(statusCode).json(processedData);
  }

  // Setup cache miss handling
  private setupCacheMissHandling(res: Response, cacheKey: string): void {
    const originalJson = res.json;

    res.json = (body: any) => {
      // Cache successful responses asynchronously
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          // Create a clean copy of data to avoid circular references
          const cleanData = body?.data ?? body;
          const responseData = {
            statusCode: res.statusCode,
            data: cleanData,
            headers: res.getHeaders(),
          };

          // Safely stringify and cache
          const serializedData = JSON.stringify(responseData);
          client
            .setEx(cacheKey, this.ttl, serializedData)
            .catch((err: any) => console.error('Cache set error:', err));
        } catch (serializeError) {
          console.error('Failed to serialize cache data:', serializeError);
          // Don't cache if serialization fails
        }
      }

      res.set('X-Cache', 'MISS').set('X-Cache-Key', cacheKey);
      return originalJson.call(res, body);
    };
  }

  getMiddleware() {
    const writeMethods = ['PUT', 'POST', 'DELETE', 'PATCH'];

    return async (req: Request, res: Response, next: NextFunction) => {
      // Handle cache invalidation for write operations
      if (writeMethods.includes(req.method)) {
        await this.handleCacheInvalidation(req);
        return next();
      }

      // Skip caching for non-GET requests or when explicitly skipped
      if (req.method !== 'GET' || this.skipCache(req)) {
        return next();
      }

      // Check Redis connection early
      if (!client.isOpen) {
        console.warn('Redis not connected, skipping cache');
        return next();
      }

      try {
        const cacheKey = this.useUrlBasedKeys
          ? CacheMiddleware.generateUrlBasedCacheKey(req)
          : this.keyGenerator(req);

        logger.info('Cache middleware processing:', {
          method: req.method,
          url: req.originalUrl,
          cacheKey,
          redisConnected: client.isOpen,
        });

        // Try to get cached response
        const cachedResponse = await client.get(cacheKey);

        if (cachedResponse) {
          return this.handleCacheHit(res, cachedResponse, cacheKey);
        }

        console.log('Cache MISS for:', req.originalUrl);
        this.setupCacheMissHandling(res, cacheKey);
        next();

      } catch (error) {
        console.error('Cache middleware error:', error);
        next(); // Continue without caching on error
      }
    };
  }
}
