import { Router } from 'express';
import { ResultController } from '../controllers/result.controller';
import { ResultService } from '../services/result.service';
import { ResultRepository } from '../repositories/result.repository';
import { PrismaClient } from '@prisma/client';

const router = Router();
const repository = new ResultRepository(new PrismaClient());
const service = new ResultService(repository);
const controller = new ResultController(service);

router.post('/', controller.create);
router.get('/', controller.findAll);
router.get('/:id', controller.findById);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
