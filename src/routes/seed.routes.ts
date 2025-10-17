import { Router } from 'express';
import {
  seedAll,
  seedPermissions,
  seedRoles,
  seedUsers,
  seedConfigs,
  seedAgents,
  seedApiKeys,
  clearAll,
  getStats
} from '../controllers/seed.controller';

const router = Router();

// Get database statistics
router.get('/stats', getStats);

// Seed all data
router.post('/all', seedAll);

// Seed individual components
router.post('/permissions', seedPermissions);
router.post('/roles', seedRoles);
router.post('/users', seedUsers);
router.post('/configs', seedConfigs);
router.post('/agents', seedAgents);
router.post('/api-keys', seedApiKeys);

// Dangerous operations
router.delete('/clear-all', clearAll);

export default router;