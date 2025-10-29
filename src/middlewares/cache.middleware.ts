import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { setup } from '../setup';
import { logger } from './logger.middle';
import { 
  CACHE_TTL, 
  CACHE_PREFIX, 
  CACHE_URL_PREFIX, 
  CACHE_USE_URL_BASED_KEYS, 
  CACHE_HASH_LENGTH,
  CACHE_HEADER_STATUS,
  CACHE_HEADER_KEY,
  CACHE_STATUS_HIT,
  CACHE_STATUS_MISS
} from '../env';
import { 
  CacheOptions, 
  CacheStats, 
  CachedResponse, 
  CacheKey, 
  WriteMethods, 
  InvalidationPaths 
} from '../interfaces/cache.interface';
const client = setup.redis;
// Cache middleware class
export class CacheMiddleware {
  private readonly ttl: number;
  private readonly skipCache: (req: Request) => boolean;
  private readonly keyGenerator: (req: Request) => CacheKey;
  private readonly useUrlBasedKeys: boolean;
  private static readonly WRITE_METHODS: ReadonlyArray<WriteMethods> = ['PUT', 'POST', 'DELETE', 'PATCH'];
  private static readonly SUCCESS_STATUS_MIN = 200;
  private static readonly SUCCESS_STATUS_MAX = 300;

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl ?? CACHE_TTL;
    this.skipCache = options.skipCache ?? (() => false);
    this.keyGenerator = options.keyGenerator ?? CacheMiddleware.generateCacheKey;
    this.useUrlBasedKeys = options.useUrlBasedKeys ?? CACHE_USE_URL_BASED_KEYS;
  }

  // Generate cache key from request
  static generateCacheKey(req: Request): CacheKey {
    const { method, originalUrl, body, query } = req;
    const data = JSON.stringify({ method, url: originalUrl, body, query });
    return `${CACHE_PREFIX}:${crypto.createHash('md5').update(data).digest('hex')}`;
  }

  // Generate a URL-based cache key for easier pattern matching
  static generateUrlBasedCacheKey(req: Request): CacheKey {
    const [cleanUrl, queryString = ''] = req.originalUrl.split('?');
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify({ method: req.method, body: req.body, query: req.query }))
      .digest('hex')
      .substring(0, CACHE_HASH_LENGTH);

    const querySuffix = queryString 
      ? ':' + Buffer.from(queryString).toString('base64').substring(0, CACHE_HASH_LENGTH)
      : '';

    return `${CACHE_URL_PREFIX}:${cleanUrl.replace(/\//g, ':')}:${hash}${querySuffix}`;
  }

  // Invalidate cache by URL path pattern
  async invalidateCacheByUrlPattern(urlPath: string): Promise<number> {
    if (!client.isOpen) {
      logger.info('Redis not connected, skipping cache invalidation');
      return 0;
    }

    try {
      const [cleanPath] = urlPath.split('?');
      const pathParts = cleanPath.split('/').filter(Boolean);
      
      // Build all patterns to check (current path + all parent paths)
      const patterns = new Set<string>();
      patterns.add(`${CACHE_URL_PREFIX}:${cleanPath.replace(/\//g, ':')}*`);
      
      for (let i = 1; i < pathParts.length; i++) {
        const parentPath = '/' + pathParts.slice(0, i).join('/');
        patterns.add(`${CACHE_URL_PREFIX}:${parentPath.replace(/\//g, ':')}*`);
      }

      // Fetch all matching keys in parallel
      const keysArrays = await Promise.all(
        Array.from(patterns).map(pattern => client.keys(pattern))
      );

      // Flatten and deduplicate
      const uniqueKeys = [...new Set(keysArrays.flat())];

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
      const keys = await client.keys(`${CACHE_PREFIX}:${pattern}`);

      if (keys.length > 0) {
        await client.del(keys);
        logger.info(`Invalidated ${keys.length} cache entries`);
      }

      return keys.length;
    } catch (error) {
      logger.error('Cache invalidation error:', error);
      return 0;
    }
  }

  // Cache statistics
  static async getCacheStats(): Promise<CacheStats> {
    try {
      const info = await client.info('memory');
      const keys = await client.keys(`${CACHE_PREFIX}:*`);

      return {
        totalKeys: keys.length,
        memoryInfo: info,
        connected: client.isOpen,
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
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
  private generateInvalidationPaths(urlPath: string): InvalidationPaths {
    const [cleanPath] = urlPath.split('?');
    const pathParts = cleanPath.split('/').filter(Boolean);
    
    // Generate all parent paths in one pass
    return pathParts.reduce<string[]>((paths, _, index) => {
      paths.push('/' + pathParts.slice(0, index + 1).join('/'));
      return paths;
    }, []).reverse(); // Reverse to invalidate from deepest to shallowest
  }

  // Handle write operations and invalidate cache
  private async handleCacheInvalidation(req: Request): Promise<void> {
    const invalidationPaths = this.generateInvalidationPaths(req.originalUrl);
    
    await Promise.all(
      invalidationPaths.map(path => 
        this.invalidateCacheByUrlPattern(path).catch(err => 
          logger.error(`Failed to invalidate cache for ${path}:`, err)
        )
      )
    );

    logger.info('Cache invalidated for paths:', invalidationPaths);
  }

  // Process cached response data
  private processResponseData(data: any): any {
    // Optimize: Skip processing for non-string data
    if (typeof data !== 'string') {
      return data;
    }

    try {
      const parsedData = JSON.parse(data);
      // Only return parsed data if it's a plain object (not array, not null)
      return (typeof parsedData === 'object' && parsedData !== null && !Array.isArray(parsedData)) 
        ? parsedData 
        : data;
    } catch {
      return data;
    }
  }

  // Handle cache hit scenario
  private handleCacheHit(res: Response, cachedResponse: string, cacheKey: CacheKey): Response {
    const { statusCode, data, headers }: CachedResponse = JSON.parse(cachedResponse);

    // Set headers efficiently in one batch
    const cacheHeaders = {
      ...headers,
      [CACHE_HEADER_STATUS]: CACHE_STATUS_HIT,
      [CACHE_HEADER_KEY]: cacheKey,
    };

    Object.entries(cacheHeaders).forEach(([key, value]) => 
      res.set(key, value as string)
    );

    logger.info('Cache HIT for:', res.req.originalUrl);
    
    return res.status(statusCode).json(this.processResponseData(data));
  }

  // Handle cache miss - intercept response and cache it
  private async handleCacheMiss(
    req: Request,
    res: Response,
    next: NextFunction,
    cacheKey: CacheKey
  ): Promise<void> {
    const originalJson = res.json;

    // Override res.json to intercept the response
    res.json = (body: any) => {
      // Only cache successful responses (2xx status codes)
      if (
        res.statusCode >= CacheMiddleware.SUCCESS_STATUS_MIN &&
        res.statusCode < CacheMiddleware.SUCCESS_STATUS_MAX
      ) {
        // Use background caching to avoid blocking the response
        setImmediate(() => {
          try {
            const cachedResponse: CachedResponse = {
              statusCode: res.statusCode,
              data: body?.data ?? body,
              headers: res.getHeaders(),
            };

            (client
              .setEx(cacheKey, this.ttl, JSON.stringify(cachedResponse)) as Promise<'OK'>)
              .catch((err: unknown) => logger.error('Cache set error:', err));
          } catch (error) {
            logger.error('Failed to cache response:', error);
          }
        });
      }

      res.set(CACHE_HEADER_STATUS, CACHE_STATUS_MISS).set(CACHE_HEADER_KEY, cacheKey);
      return originalJson.call(res, body);
    };

    next();
  }

  public getMiddleware(): (req: Request, res: Response, next: NextFunction) => Promise<void> {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { method } = req;

      // Skip caching: write operations, non-GET requests, explicit skip, or Redis disconnected
      if (
        CacheMiddleware.WRITE_METHODS.includes(method as WriteMethods) ||
        method !== 'GET' ||
        this.skipCache(req) ||
        !client.isOpen
      ) {
        // Handle cache invalidation for write operations
        if (CacheMiddleware.WRITE_METHODS.includes(method as WriteMethods)) {
          await this.handleCacheInvalidation(req);
        }
        
        if (!client.isOpen) {
          logger.warn('Redis not connected, skipping cache');
        }
        
        return next();
      }

      try {
        const cacheKey = this.useUrlBasedKeys
          ? CacheMiddleware.generateUrlBasedCacheKey(req)
          : this.keyGenerator(req);

        const cachedData = await client.get(cacheKey);

        if (cachedData) {
          const { statusCode, data, headers }: CachedResponse = JSON.parse(cachedData);
          
          // Set headers in batch
          const cacheHeaders = {
            ...headers,
            [CACHE_HEADER_STATUS]: CACHE_STATUS_HIT,
            [CACHE_HEADER_KEY]: cacheKey,
          };
          
          Object.entries(cacheHeaders).forEach(([key, value]) => 
            res.set(key, value as string)
          );

          logger.info(`Cache HIT: ${cacheKey}`);
          res.status(statusCode).json(this.processResponseData(data));
          return;
        }

        // Cache MISS - store response
        await this.handleCacheMiss(req, res, next, cacheKey);
      } catch (error) {
        logger.error('Cache middleware error:', error);
        next();
      }
    };
  }
}

export const cacheMiddleware = new CacheMiddleware()