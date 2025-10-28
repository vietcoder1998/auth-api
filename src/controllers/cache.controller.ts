import { Request, Response } from 'express';
import { client } from '../setup';
import { ResponseMiddleware } from '../middlewares';

export class CacheController {
  /**
   * Helper function to check Redis connection
   */
  private static ensureRedisClient() {
    if (!client) {
      throw new Error('Redis client is not initialized. Please check if Redis server is running.');
    }

    if (!client.isOpen) {
      throw new Error(
        'Redis client is not connected. Please check if Redis server is running on localhost:6379',
      );
    }

    return client;
  }

  /**
   * Get all cache keys with pagination
   */
  static async getCacheKeys(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, pattern = 'cache:*', q } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const redisClient = CacheController.ensureRedisClient();

      // Get all keys matching pattern
      let searchPattern = pattern as string;
      if (q && typeof q === 'string' && q.trim()) {
        // If search query exists, combine with pattern
        searchPattern = `*${q.trim()}*`;
      }

      const allKeys = await redisClient.keys(searchPattern);

      // Get key details with creation time approximation
      const keysWithDetails = await Promise.all(
        allKeys.map(async (key) => {
          const value = await redisClient.get(key);
          const ttl = await redisClient.ttl(key);

          // Try to parse as JSON, fallback to raw value if not valid JSON
          let parsedValue = null;
          let createdAt = new Date(); // Default to current time as approximation

          if (value) {
            try {
              parsedValue = JSON.parse(value);
              // If the cached data has a timestamp or createdAt, use it
              if (parsedValue && typeof parsedValue === 'object') {
                if (parsedValue.createdAt) {
                  createdAt = new Date(parsedValue.createdAt);
                } else if (parsedValue.timestamp) {
                  createdAt = new Date(parsedValue.timestamp);
                }
              }
            } catch (jsonError) {
              // If JSON parsing fails, store the raw string value
              parsedValue = value;
            }
          }

          return {
            key,
            value: parsedValue,
            ttl: ttl === -1 ? 'no expiry' : `${ttl}s`,
            size: value ? Buffer.byteLength(value, 'utf8') : 0,
            createdAt: createdAt.toISOString(),
            timestamp: createdAt.getTime(),
          };
        }),
      );

      // Sort by timestamp (newest first)
      keysWithDetails.sort((a, b) => b.timestamp - a.timestamp);

      const total = keysWithDetails.length;

      // Paginate after sorting
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedKeys = keysWithDetails.slice(startIndex, endIndex);

      // Remove timestamp field from response (used only for sorting)
      const response = paginatedKeys.map(({ timestamp, ...rest }) => rest);

      ResponseMiddleware.setPaginationMeta(req, total, pageNum, limitNum);
      res.json(response);
    } catch (error) {
      console.error('Error getting cache keys:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve cache keys';
      res.status(500).json({
        error: errorMessage,
        suggestion: 'Please ensure Redis server is running on localhost:6379',
      });
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(req: Request, res: Response) {
    try {
      const redisClient = CacheController.ensureRedisClient();

      const info = await redisClient.info();
      const dbSize = await redisClient.dbSize();
      const allKeys = await redisClient.keys('*');

      // Calculate total memory usage
      let totalSize = 0;
      for (const key of allKeys) {
        const value = await redisClient.get(key);
        if (value) {
          totalSize += Buffer.byteLength(value, 'utf8');
        }
      }

      // Parse Redis info
      const infoLines = info.split('\r\n');
      const memoryInfo = infoLines.find((line) => line.startsWith('used_memory_human:'));
      const uptimeInfo = infoLines.find((line) => line.startsWith('uptime_in_seconds:'));
      const connectedClients = infoLines.find((line) => line.startsWith('connected_clients:'));

      const stats = {
        totalKeys: dbSize,
        totalMemoryUsage: memoryInfo ? memoryInfo.split(':')[1] : 'unknown',
        uptime: uptimeInfo
          ? `${Math.floor(parseInt(uptimeInfo.split(':')[1]) / 3600)}h`
          : 'unknown',
        connectedClients: connectedClients ? connectedClients.split(':')[1] : 'unknown',
        dataSize: `${Math.round(totalSize / 1024)}KB`,
        patterns: {
          'auth:*': allKeys.filter((key) => key.startsWith('auth:')).length,
          'token:*': allKeys.filter((key) => key.startsWith('token:')).length,
          'cache:*': allKeys.filter((key) => key.startsWith('cache:')).length,
          other: allKeys.filter((key) => !key.match(/^(auth|token|cache):/)).length,
        },
      };

      res.json(stats);
    } catch (error) {
      console.error('Error getting cache stats:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to retrieve cache statistics';
      res.status(500).json({
        error: errorMessage,
        suggestion: 'Please ensure Redis server is running on localhost:6379',
      });
    }
  }

  /**
   * Get specific cache value by key
   */
  static async getCacheValue(req: Request, res: Response) {
    try {
      const { key } = req.params;

      if (!key) {
        return res.status(400).json({ error: 'Cache key is required' });
      }

      const redisClient = CacheController.ensureRedisClient();

      const value = await redisClient.get(key);
      const ttl = await redisClient.ttl(key);

      if (value === null) {
        return res.status(404).json({ error: 'Cache key not found' });
      }

      // Try to parse as JSON, fallback to raw value if not valid JSON
      let parsedValue;
      try {
        parsedValue = JSON.parse(value);
      } catch (jsonError) {
        // If JSON parsing fails, store the raw string value
        parsedValue = value;
      }

      const cacheData = {
        key,
        value: parsedValue,
        ttl: ttl === -1 ? 'no expiry' : `${ttl}s`,
        size: Buffer.byteLength(value, 'utf8'),
        createdAt: new Date().toISOString(), // Approximate
      };

      res.json(cacheData);
    } catch (error) {
      console.error('Error getting cache value:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to retrieve cache value';
      res.status(500).json({
        error: errorMessage,
        suggestion: 'Please ensure Redis server is running on localhost:6379',
      });
    }
  }

  /**
   * Delete specific cache key
   */
  static async deleteCacheKey(req: Request, res: Response) {
    try {
      const { key } = req.params;

      if (!key) {
        return res.status(400).json({ error: 'Cache key is required' });
      }

      const redisClient = CacheController.ensureRedisClient();

      const result = await redisClient.del(key);

      if (result === 0) {
        return res.status(404).json({ error: 'Cache key not found' });
      }

      res.json({
        message: `Cache key '${key}' deleted successfully`,
        deleted: true,
      });
    } catch (error) {
      console.error('Error deleting cache key:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete cache key';
      res.status(500).json({
        error: errorMessage,
        suggestion: 'Please ensure Redis server is running on localhost:6379',
      });
    }
  }

  /**
   * Clear all cache (flush all keys)
   */
  static async clearAllCache(req: Request, res: Response) {
    try {
      const redisClient = CacheController.ensureRedisClient();

      await redisClient.flushAll();

      res.json({
        message: 'All cache cleared successfully',
        cleared: true,
      });
    } catch (error) {
      console.error('Error clearing all cache:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear all cache';
      res.status(500).json({
        error: errorMessage,
        suggestion: 'Please ensure Redis server is running on localhost:6379',
      });
    }
  }

  /**
   * Clear cache by pattern
   */
  static async clearCacheByPattern(req: Request, res: Response) {
    try {
      const { pattern } = req.body;

      if (!pattern) {
        return res.status(400).json({ error: 'Pattern is required' });
      }

      const redisClient = CacheController.ensureRedisClient();

      const keys = await redisClient.keys(pattern);

      if (keys.length === 0) {
        return res.json({
          message: `No keys found matching pattern '${pattern}'`,
          deleted: 0,
        });
      }

      const result = await redisClient.del(keys);

      res.json({
        message: `${result} cache keys deleted matching pattern '${pattern}'`,
        deleted: result,
        pattern,
      });
    } catch (error) {
      console.error('Error clearing cache by pattern:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to clear cache by pattern';
      res.status(500).json({
        error: errorMessage,
        suggestion: 'Please ensure Redis server is running on localhost:6379',
      });
    }
  }

  /**
   * Set cache value with TTL
   */
  static async setCacheValue(req: Request, res: Response) {
    try {
      const { key, value, ttl } = req.body;

      if (!key || value === undefined) {
        return res.status(400).json({ error: 'Key and value are required' });
      }

      const redisClient = CacheController.ensureRedisClient();

      const valueStr = JSON.stringify(value);

      if (ttl && ttl > 0) {
        await redisClient.setEx(key, ttl, valueStr);
      } else {
        await redisClient.set(key, valueStr);
      }

      res.json({
        message: `Cache key '${key}' set successfully`,
        key,
        ttl: ttl || 'no expiry',
        size: Buffer.byteLength(valueStr, 'utf8'),
      });
    } catch (error) {
      console.error('Error setting cache value:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to set cache value';
      res.status(500).json({
        error: errorMessage,
        suggestion: 'Please ensure Redis server is running on localhost:6379',
      });
    }
  }
}
