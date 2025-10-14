import { Router } from 'express';
import { getConfig, getConfigByKey, updateConfig, createConfig, deleteConfig } from '../controllers/config.controller';

const router = Router();

router.get('/', getConfig);
router.get('/:key', getConfigByKey);
router.post('/', createConfig);
router.put('/', updateConfig);
router.delete('/:key', deleteConfig);

export default router;