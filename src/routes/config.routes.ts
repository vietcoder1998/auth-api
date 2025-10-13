import { Router } from 'express';
import { getConfig, updateConfig, createConfig } from '../controllers/config.controller';

const router = Router();

// Get all config entries
router.get('/', getConfig);
// Create new config entry
router.post('/', createConfig);
// Update config value inline
router.put('/', updateConfig);

export default router;
