import { BaseRouter } from './base.route';
import { ToolExplainResultController } from '../controllers/tool-explain-result.controller';
import { ToolExplainResultService } from '../services/tool-explain-result.service';
import { ToolExplainResultRepository } from '../repositories/tool-explain-result.repository';
import { PrismaClient } from '@prisma/client';

const repository = new ToolExplainResultRepository(new PrismaClient());
const service = new ToolExplainResultService(repository);
const controller = new ToolExplainResultController(service);

const router = new BaseRouter('tool-explain-result', controller).routes;
export default router;
