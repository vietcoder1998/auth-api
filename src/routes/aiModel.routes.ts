import { Router } from 'express';
import { aiModelController } from '../controllers/aiModel.controller';

const router = Router();

router.post('/', aiModelController.create);
router.get('/', aiModelController.getAll);
router.get('/:id', aiModelController.getById);
router.put('/:id', aiModelController.update);
router.delete('/:id', aiModelController.delete);

export default router;
