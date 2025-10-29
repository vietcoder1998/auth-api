import { BaseRouter } from './base.route';
import { aiModelController } from '../controllers/aiModel.controller';
import { AIModelDto, AIModelDro, AIModelModel } from '../interfaces';

export class AIModelRoutes extends BaseRouter<AIModelModel, AIModelDto, AIModelDro> {
  constructor() {
    super('/ai-models');
    this.initializeRoutes();
  }

  override initializeRoutes(): void {
    // Standard CRUD routes
    this.routes.post('/', aiModelController.create.bind(aiModelController));
    this.routes.get('/', aiModelController.getAll.bind(aiModelController));
    this.routes.get('/:id', aiModelController.getById.bind(aiModelController));
    this.routes.put('/:id', aiModelController.update.bind(aiModelController));
    this.routes.delete('/:id', aiModelController.delete.bind(aiModelController));

    // Custom route for fetching Gemini models
    this.routes.post('/fetch-gemini-models', aiModelController.fetchGeminiModels.bind(aiModelController));
    // Generic models selection endpoint (query or body driven)
    this.routes.get('/models', aiModelController.selectModels.bind(aiModelController));
    this.routes.post('/models/select', aiModelController.selectModels.bind(aiModelController));
  }
}

export const aiModelRoutes = new AIModelRoutes().routes;
