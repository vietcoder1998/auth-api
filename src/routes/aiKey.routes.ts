import { BaseRouter } from './base.route';
import { aiKeyController } from '../controllers/aiKey.controller';
import { AIKeyModel, AIKeyDto } from '../interfaces';

/**
 * AIKeyRouter - Routes for AI key management
 * 
 * Extends BaseRouter to provide standard CRUD routes
 * plus custom routes for AI key specific functionality.
 */
export class AIKeyRouter extends BaseRouter<AIKeyModel, AIKeyDto, AIKeyDto> {
  constructor() {
    super('ai-keys', aiKeyController);
    this.initializeCustomRoutes();
  }

  protected initializeRoutes(controller: typeof aiKeyController): void {
    // Override base routes to use our custom methods where needed
    this.routes.get('/', controller.findAll.bind(controller)); // Use findAll instead of search for includes
    this.routes.post('/', controller.create.bind(controller));
    this.routes.get('/:id', controller.findOne.bind(controller));
    this.routes.put('/:id', controller.update.bind(controller));
    this.routes.delete('/:id', controller.delete.bind(controller));
    
    // Additional standard routes
    this.routes.delete('/:id/soft', controller.softDelete.bind(controller));
    this.routes.post('/batch', controller.createMany.bind(controller));
    this.routes.put('/batch', controller.updateMany.bind(controller));
    this.routes.delete('/batch', controller.deleteMany.bind(controller));
    this.routes.post('/batch/soft-delete', controller.softDeleteMany.bind(controller));
    this.routes.post('/search', controller.search.bind(controller));
    this.routes.get('/count', controller.count.bind(controller));
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
