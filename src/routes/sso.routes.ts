import { Router } from 'express';
import {
  getSSOEntries,
  getSSOById,
  createSSO,
  updateSSO,
  deleteSSO,
  regenerateKey,
  getSSOStats,
} from '../controllers/sso.controller';

const router = Router();

// Get all SSO entries with pagination and filtering
router.get('/', getSSOEntries);

// Get SSO statistics
router.get('/stats', getSSOStats);

// Get specific SSO entry by ID
router.get('/:id', getSSOById);

// Create new SSO entry
router.post('/', createSSO);

// Update SSO entry
router.put('/:id', updateSSO);

// Delete SSO entry
router.delete('/:id', deleteSSO);

// Regenerate SSO key
router.patch('/:id/regenerate-key', regenerateKey);

export default router;