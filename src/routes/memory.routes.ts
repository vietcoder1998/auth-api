import { MemoryController, memoryController } from '../controllers/memory.controller';
import {
  AgentMemoryDro,
  AgentMemoryDto,
  AgentMemoryModel,
} from '../interfaces/agentmemory.interface';
import { BaseRouter } from './base.route';

export class MemoryRouter extends BaseRouter<AgentMemoryModel, AgentMemoryDto, AgentMemoryDro> {
  constructor() {
    super('/memories', memoryController);
  }

  protected initializeRoutes(controller: MemoryController) {
    // Use BaseRouter's default routes that work with BaseController
    super.initializeRoutes(controller);
  }
}

// Export an instance for use in the application
export const memoryRoutes = new MemoryRouter();
