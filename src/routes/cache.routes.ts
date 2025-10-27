import { Router } from 'express';
import {
  CacheController
} from '../controllers/cache.controller';

const router = Router();

// GET /api/admin/cache - Get all cache keys with pagination
router.get('/', CacheController.getCacheKeys);

// GET /api/admin/cache/stats - Get cache statistics
router.get('/stats', CacheController.getCacheStats);

// GET /api/admin/cache/:key - Get specific cache value
router.get('/:key', CacheController.getCacheValue);

// DELETE /api/admin/cache/:key - Delete specific cache key
router.delete('/:key', CacheController.deleteCacheKey);

// DELETE /api/admin/cache - Clear all cache
router.delete('/', CacheController.clearAllCache);

// POST /api/admin/cache/clear - Clear cache by pattern
router.post('/clear', CacheController.clearCacheByPattern);

// POST /api/admin/cache - Set cache value
router.post('/', CacheController.setCacheValue);

export default router;
