import { Router } from 'express';
import { MemoryController } from '../controllers/memory.controller';

const router = Router();

router.post('/', MemoryController.create);
router.get('/', MemoryController.getAll);
router.get('/:id', MemoryController.getById);
router.put('/:id', MemoryController.update);
router.delete('/:id', MemoryController.delete);

export default router;
