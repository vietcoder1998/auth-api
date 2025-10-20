import { Router } from 'express';
import {
  getCacheKeys,
  getCacheStats,
  getCacheValue,
  deleteCacheKey,
  clearAllCache,
  clearCacheByPattern,
  setCacheValue,
} from '../controllers/cache.controller';

const router = Router();

// GET /api/admin/cache - Get all cache keys with pagination
router.get('/', getCacheKeys);

// GET /api/admin/cache/stats - Get cache statistics
router.get('/stats', getCacheStats);

// GET /api/admin/cache/:key - Get specific cache value
router.get('/:key', getCacheValue);

// DELETE /api/admin/cache/:key - Delete specific cache key
router.delete('/:key', deleteCacheKey);

// DELETE /api/admin/cache - Clear all cache
router.delete('/', clearAllCache);

// POST /api/admin/cache/clear - Clear cache by pattern
router.post('/clear', clearCacheByPattern);

// POST /api/admin/cache - Set cache value
router.post('/', setCacheValue);

export default router;
