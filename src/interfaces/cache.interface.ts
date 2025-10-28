import { Request } from 'express';

/**
 * Cache middleware options
 */
export interface CacheOptions {
  /** Time to live in seconds */
  ttl?: number;
  /** Function to determine if caching should be skipped */
  skipCache?: (req: Request) => boolean;
  /** Custom key generator */
  keyGenerator?: (req: Request) => string;
  /** Use URL-based keys for easier pattern matching */
  useUrlBasedKeys?: boolean;
}

/**
 * Cache statistics response
 */
export interface CacheStats {
  /** Total number of cache keys */
  totalKeys: number;
  /** Redis memory information */
  memoryInfo: string;
  /** Redis connection status */
  connected: boolean;
  /** Error message if stats retrieval failed */
  error?: string;
}

/**
 * Cached response structure
 */
export interface CachedResponse {
  /** HTTP status code */
  statusCode: number;
  /** Response data */
  data: any;
  /** Response headers */
  headers: Record<string, any>;
}

/**
 * Cache invalidation result
 */
export interface CacheInvalidationResult {
  /** Number of cache entries invalidated */
  count: number;
}

/**
 * Cache key generation result
 */
export type CacheKey = string;

/**
 * Write methods that trigger cache invalidation
 */
export type WriteMethods = 'PUT' | 'POST' | 'DELETE' | 'PATCH';

/**
 * Cache invalidation paths
 */
export type InvalidationPaths = string[];
