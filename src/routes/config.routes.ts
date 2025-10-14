import { Router } from 'express';
import { getConfig, updateConfig, createConfig } from '../controllers/config.controller';

const router = Router();

router.get('/', getConfig);
router.post('/', createConfig);
router.put('/', updateConfig);

export default router;
