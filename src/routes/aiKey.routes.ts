import { AIKeyController, aiKeyController } from '../controllers';
import { AIKeyDto, AIKeyModel } from '../interfaces';
import { BaseRouter } from './base.route';

/**
 * AIKeyRouter - Routes for AI key management
 *
 * Extends BaseRouter to provide standard CRUD routes
 * plus custom routes for AI key specific functionality.
 */
export class AIKeyRouter extends BaseRouter<AIKeyModel, AIKeyDto, AIKeyDto> {
  constructor() {
    super('ai-keys', aiKeyController);
    this.initializeRoutes(aiKeyController);
    this.initializeCustomRoutes();
  }

  protected initializeRoutes(aiKeyController: AIKeyController): void {
    // Override base routes to use our custom methods where needed
    this.routes.get('/', aiKeyController.findAll.bind(aiKeyController)); // Use findAll instead of search for includes
    this.routes.post('/', aiKeyController.create.bind(aiKeyController));
    this.routes.get('/:id', aiKeyController.findOne.bind(aiKeyController));
    this.routes.put('/:id', aiKeyController.update.bind(aiKeyController));
    this.routes.delete('/:id', aiKeyController.delete.bind(aiKeyController));

    // Additional standard routes
    this.routes.delete('/:id/soft', aiKeyController.softDelete.bind(aiKeyController));
    this.routes.post('/batch', aiKeyController.createMany.bind(aiKeyController));
    this.routes.put('/batch', aiKeyController.updateMany.bind(aiKeyController));
    this.routes.delete('/batch', aiKeyController.deleteMany.bind(aiKeyController));
    this.routes.post('/batch/soft-delete', aiKeyController.softDeleteMany.bind(aiKeyController));
    this.routes.post('/search', aiKeyController.search.bind(aiKeyController));
    this.routes.get('/count', aiKeyController.count.bind(aiKeyController));
  }

  /**
   * Initialize custom routes specific to AI keys
   */
  private initializeCustomRoutes(): void {
    // Custom AI key routes - order matters, put specific routes before parameterized ones
    this.routes.get('/user/:userId', aiKeyController.getAIKeysByUserId.bind(aiKeyController));
    this.routes.get('/active', aiKeyController.getActiveAIKeys.bind(aiKeyController));
    this.routes.get('/by-key/:key', aiKeyController.findByKey.bind(aiKeyController));
  }
}

// Export an instance of the router
export const aiKeyRouter = new AIKeyRouter();
export default aiKeyRouter.routes;
