import { Router } from 'express';
import { getConfig, updateConfig } from '../controllers/config.controller';

const router = Router();

// Get all config entries
router.get('/', getConfig);
// Update config value inline
router.put('/', updateConfig);

export default router;
