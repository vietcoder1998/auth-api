import { Router } from 'express';
import { BaseRouter } from './base.route';
import { EntityMethodModel, EntityMethodDto, EntityMethodDro } from '../interfaces';
import { adminEntityMethodController } from '../controllers/entitymethod.controller';

/**
 * EntityMethodRouter - Defines routes for EntityMethod operations
 * 
 * Extends BaseRouter to provide standard CRUD routes plus custom endpoints
 * for entity method management and operations.
 * 
 * Routes:
 * - GET    /api/admin/entity-methods           - List all entity methods
 * - POST   /api/admin/entity-methods           - Create new entity method
 * - GET    /api/admin/entity-methods/:id       - Get entity method by ID
 * - PUT    /api/admin/entity-methods/:id       - Update entity method
 * - DELETE /api/admin/entity-methods/:id       - Delete entity method
 * - GET    /api/admin/entity-methods/stats     - Get entity method statistics
 * - GET    /api/admin/entity-methods/by-name/:name - Get methods by name
 * - GET    /api/admin/entity-methods/entity/:entityId/methods - Get methods for entity
 * - POST   /api/admin/entity-methods/entity/:entityId/methods - Create method for entity
 */
export class EntityMethodRouter extends BaseRouter<EntityMethodModel, EntityMethodDto, EntityMethodDro> {
  
  constructor() {
    super('/entity-methods', adminEntityMethodController);
    this.initializeCustomRoutes();
  }

  /**
   * Initialize custom routes specific to entity methods
   */
  private initializeCustomRoutes(): void {
    // Statistics route (must be before /:id to avoid conflicts)
    this.routes.get('/stats', adminEntityMethodController.getStats.bind(adminEntityMethodController));
    
    // Get methods by name
    this.routes.get('/by-name/:name', adminEntityMethodController.getByName.bind(adminEntityMethodController));
    
    // Entity-specific method routes
    this.routes.get('/entity/:entityId/methods', adminEntityMethodController.getMethodsByEntity.bind(adminEntityMethodController));
    this.routes.post('/entity/:entityId/methods', adminEntityMethodController.createMethodForEntity.bind(adminEntityMethodController));
    
    // Batch operations
    this.routes.post('/batch', adminEntityMethodController.createMany.bind(adminEntityMethodController));
    this.routes.put('/batch', adminEntityMethodController.updateMany.bind(adminEntityMethodController));
    this.routes.delete('/batch', adminEntityMethodController.deleteMany.bind(adminEntityMethodController));
    
    // Search and count
    this.routes.post('/search', adminEntityMethodController.search.bind(adminEntityMethodController));
    this.routes.get('/count', adminEntityMethodController.count.bind(adminEntityMethodController));
  }

  /**
   * Override to customize base routes if needed
   */
  protected initializeRoutes(controller: any): void {
    // Standard CRUD routes
    this.routes.get('/', controller.findAll.bind(controller));
    this.routes.post('/', controller.create.bind(controller));
    this.routes.get('/:id', controller.findOne.bind(controller));
    this.routes.put('/:id', controller.update.bind(controller));
    this.routes.delete('/:id', controller.delete.bind(controller));
  }
}

export const entityMethodRouter = new EntityMethodRouter();
export default entityMethodRouter;