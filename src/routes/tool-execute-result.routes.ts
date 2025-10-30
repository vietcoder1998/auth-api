import { Router } from 'express';
import { ToolExecuteResultController } from '../controllers/tool-execute-result.controller';
import { ToolExecuteResultService } from '../services/tool-execute-result.service';
import { ToolExecuteResultRepository } from '../repositories/tool-execute-result.repository';
import { PrismaClient } from '@prisma/client';

const router = Router();
const repository = new ToolExecuteResultRepository(new PrismaClient());
const service = new ToolExecuteResultService(repository);
const controller = new ToolExecuteResultController(service);

router.post('/', controller.create);
router.get('/', controller.findAll);
router.get('/:id', controller.findById);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
