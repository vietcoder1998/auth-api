import { Router } from 'express';
import {
  getApiKeys,
  createApiKey,
  updateApiKey,
  regenerateApiKey,
  deleteApiKey,
  getApiKeyStats,
  getSpecificApiKeyStats,
  getApiKeyLogs
} from '../controllers/apiKey.controller';

const router = Router();

// Get all API keys (admin only)
router.get('/', getApiKeys);

// Get general API key statistics
router.get('/stats', getApiKeyStats);

// Create new API key
router.post('/', createApiKey);

// Update API key
router.put('/:id', updateApiKey);

// Regenerate API key
router.post('/:id/regenerate', regenerateApiKey);

// Delete API key
router.delete('/:id', deleteApiKey);

// Get specific API key usage statistics  
router.get('/:id/stats', getSpecificApiKeyStats);

// Get specific API key usage logs
router.get('/:id/logs', getApiKeyLogs);

export default router;