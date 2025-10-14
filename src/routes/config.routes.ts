import { Router } from 'express';
import { getConfig, getConfigByKey, updateConfig, createConfig } from '../controllers/config.controller';

const router = Router();

router.get('/', getConfig);
router.get('/:key', getConfigByKey);
router.post('/', createConfig);
router.put('/', updateConfig);

export default router;
