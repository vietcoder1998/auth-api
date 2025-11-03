import { BaseRouter } from './base.route';
import { aiModelController } from '../controllers/aiModel.controller';
import { AIModelDto, AIModelDro, AIModel} from '../interfaces';

export class AIModelRoutes extends BaseRouter<AIModel, AIModelDto, AIModelDro> {
  constructor() {
    super('/ai-models', aiModelController);
    this.initializeCustomRoutes();
  }

  protected initializeCustomRoutes(): void {
    // Custom route for fetching Gemini models
    this.routes.post('/fetch-gemini-models', aiModelController.fetchGeminiModels.bind(aiModelController));
    // Generic models selection endpoint (query or body driven)
    this.routes.get('/models', aiModelController.selectModels.bind(aiModelController));
    this.routes.post('/models/select', aiModelController.selectModels.bind(aiModelController));
  }
}

export const aiModelRoutes = new AIModelRoutes().routes;
