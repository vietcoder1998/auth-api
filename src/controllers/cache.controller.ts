import { Request, Response } from 'express';
import { setPaginationMeta } from '../middlewares/response.middleware';
import { client } from '../setup';

// Helper function to check Redis connection
function ensureRedisClient() {
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
export async function getCacheKeys(req: Request, res: Response) {
  try {
    const { page = 1, limit = 20, pattern = '*' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const client = ensureRedisClient();

    // Get all keys matching pattern
    const allKeys = await client.keys(pattern as string);
    const total = allKeys.length;

    // Paginate keys
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedKeys = allKeys.slice(startIndex, endIndex);

    // Get values for paginated keys
    const keysWithValues = await Promise.all(
      paginatedKeys.map(async (key) => {
        const value = await client.get(key);
        const ttl = await client.ttl(key);

        // Try to parse as JSON, fallback to raw value if not valid JSON
        let parsedValue = null;
        if (value) {
          try {
            parsedValue = JSON.parse(value);
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
        };
      }),
    );

    setPaginationMeta(req, total, pageNum, limitNum);
    res.json(keysWithValues);
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
export async function getCacheStats(req: Request, res: Response) {
  try {
    const client = ensureRedisClient();

    const info = await client.info();
    const dbSize = await client.dbSize();
    const allKeys = await client.keys('*');

    // Calculate total memory usage
    let totalSize = 0;
    for (const key of allKeys) {
      const value = await client.get(key);
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
      uptime: uptimeInfo ? `${Math.floor(parseInt(uptimeInfo.split(':')[1]) / 3600)}h` : 'unknown',
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
export async function getCacheValue(req: Request, res: Response) {
  try {
    const { key } = req.params;

    if (!key) {
      return res.status(400).json({ error: 'Cache key is required' });
    }

    const client = ensureRedisClient();

    const value = await client.get(key);
    const ttl = await client.ttl(key);

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
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve cache value';
    res.status(500).json({
      error: errorMessage,
      suggestion: 'Please ensure Redis server is running on localhost:6379',
    });
  }
}

/**
 * Delete specific cache key
 */
export async function deleteCacheKey(req: Request, res: Response) {
  try {
    const { key } = req.params;

    if (!key) {
      return res.status(400).json({ error: 'Cache key is required' });
    }

    const client = ensureRedisClient();

    const result = await client.del(key);

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
export async function clearAllCache(req: Request, res: Response) {
  try {
    const client = ensureRedisClient();

    await client.flushAll();

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
export async function clearCacheByPattern(req: Request, res: Response) {
  try {
    const { pattern } = req.body;

    if (!pattern) {
      return res.status(400).json({ error: 'Pattern is required' });
    }

    const client = ensureRedisClient();

    const keys = await client.keys(pattern);

    if (keys.length === 0) {
      return res.json({
        message: `No keys found matching pattern '${pattern}'`,
        deleted: 0,
      });
    }

    const result = await client.del(keys);

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
export async function setCacheValue(req: Request, res: Response) {
  try {
    const { key, value, ttl } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    const client = ensureRedisClient();

    const valueStr = JSON.stringify(value);

    if (ttl && ttl > 0) {
      await client.setEx(key, ttl, valueStr);
    } else {
      await client.set(key, valueStr);
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
