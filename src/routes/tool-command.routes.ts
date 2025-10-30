import { Router } from 'express';
import { ToolCommandController } from '../controllers/tool-command.controller';
import { ToolCommandService } from '../services/tool-command.service';
import { ToolCommandRepository } from '../repositories/tool-command.repository';
import { PrismaClient } from '@prisma/client';

const router = Router();
const repository = new ToolCommandRepository(new PrismaClient());
const service = new ToolCommandService(repository);
const controller = new ToolCommandController(service);

router.post('/', controller.create);
router.get('/', controller.findAll);
router.get('/:id', controller.findOne);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
