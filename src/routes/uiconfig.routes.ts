import { Router } from 'express';
import {
  listUiConfigs,
  getUiConfig,
  createUiConfig,
  updateUiConfig,
  deleteUiConfig,
} from '../controllers/uiconfig.controller';

const router = Router();

router.get('/', listUiConfigs);
router.get('/:id', getUiConfig);
router.post('/', createUiConfig);
router.put('/:id', updateUiConfig);
router.delete('/:id', deleteUiConfig);

export default router;
