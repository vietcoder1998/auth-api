import { Router } from 'express';
import * as aiKeyController from '../controllers/aiKey.controller';

const router = Router();

router.post('/', aiKeyController.createAIKey);
router.get('/', aiKeyController.getAIKeys);
router.get('/:id', aiKeyController.getAIKeyById);
router.put('/:id', aiKeyController.updateAIKey);
router.delete('/:id', aiKeyController.deleteAIKey);

export default router;
