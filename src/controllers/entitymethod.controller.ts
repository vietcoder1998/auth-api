import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { EntityMethodModel, EntityMethodDto, EntityMethodDro } from '../interfaces';
import { entityMethodService } from '../services/entitymethod.service';

/**
 * AdminEntityMethodController - Handles HTTP requests for EntityMethod operations
 * 
 * Extends BaseController to provide standard CRUD operations for entity methods.
 * Includes custom endpoints specific to entity method management.
 * 
 * @example
 * GET    /api/admin/entity-methods     - List all entity methods
 * GET    /api/admin/entity-methods/:id - Get entity method by ID
 * POST   /api/admin/entity-methods     - Create new entity method
 * PUT    /api/admin/entity-methods/:id - Update entity method
 * DELETE /api/admin/entity-methods/:id - Delete entity method
 */
export class AdminEntityMethodController extends BaseController<EntityMethodModel, EntityMethodDto, EntityMethodDro> {
  
  constructor() {
    super(entityMethodService);
  }

  /**
   * GET /entity/:entityId/methods - Get all methods for a specific entity
   */
  async getMethodsByEntity(req: Request, res: Response): Promise<void> {
    try {
      const { entityId } = req.params;
      
      if (!entityId) {
        res.status(400).json({
          success: false,
          error: 'Entity ID is required',
        });
        return;
      }

      const methods = await entityMethodService.findMany({ entityId });
      this.sendSuccess(res, methods, `Found ${methods.length} methods for entity`);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /entity/:entityId/methods - Create a new method for a specific entity
   */
  async createMethodForEntity(req: Request, res: Response): Promise<void> {
    try {
      const { entityId } = req.params;
      const methodData = req.body;

      if (!entityId) {
        res.status(400).json({
          success: false,
          error: 'Entity ID is required',
        });
        return;
      }

      // Add entityId to the method data
      const entityMethod = await entityMethodService.create({
        ...methodData,
        entityId,
      });

      this.sendSuccess(res, entityMethod, 'Entity method created successfully', 201);
    } catch (error) {
      this.handleError(res, error, 400);
    }
  }

  /**
   * GET /by-name/:name - Get entity method by name
   */
  async getByName(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      
      if (!name) {
        res.status(400).json({
          success: false,
          error: 'Method name is required',
        });
        return;
      }

      const methods = await entityMethodService.findMany({ name });
      
      if (methods.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Entity method not found',
        });
        return;
      }

      this.sendSuccess(res, methods, `Found ${methods.length} methods with name '${name}'`);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /stats - Get entity method statistics
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const allMethods = await entityMethodService.findAll();
      
      // Group by entity to get stats
      const entityStats = allMethods.reduce((acc: any, method: any) => {
        const entityId = method.entityId || 'unknown';
        if (!acc[entityId]) {
          acc[entityId] = 0;
        }
        acc[entityId]++;
        return acc;
      }, {});

      const stats = {
        total: allMethods.length,
        byEntity: entityStats,
        totalEntities: Object.keys(entityStats).length,
      };

      this.sendSuccess(res, stats, 'Entity method statistics retrieved');
    } catch (error) {
      this.handleError(res, error);
    }
  }
}

export const adminEntityMethodController = new AdminEntityMethodController();