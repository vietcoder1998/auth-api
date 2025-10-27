import { Request, Response } from 'express';
import { BaseService } from '../services/base.service';

/**
 * BaseController - Generic controller pattern implementation for HTTP request handling
 * 
 * Provides common CRUD endpoint handlers that work with BaseService.
 * All entity-specific controllers should extend this class.
 * 
 * @template T - The Prisma model delegate type
 * @template Dto - Data Transfer Object type for input operations
 * @template Dro - Data Response Object type for output operations
 * 
 * @example
 * ```typescript
 * export class UserController extends BaseController<UserModel, UserDto, UserDro> {
 *   constructor() {
 *     const userService = new UserService();
 *     super(userService);
 *   }
 *   
 *   // Add custom endpoint handlers
 *   async activateUser(req: Request, res: Response) {
 *     try {
 *       const { id } = req.params;
 *       const user = await this.service.update(id, { status: 'active' });
 *       res.json({ success: true, data: user });
 *     } catch (error) {
 *       this.handleError(res, error);
 *     }
 *   }
 * }
 * ```
 */
export class BaseController<T, Dto, Dro> {
  protected service: BaseService<T, Dto, Dro>;

  /**
   * Creates a new controller instance
   * @param service - Service instance for business logic
   */
  constructor(service: BaseService<T, Dto, Dro>) {
    this.service = service;
  }

  /**
   * Handle errors in a standardized way
   * @param res - Express response object
   * @param error - The error that occurred
   * @param statusCode - HTTP status code (default: 500)
   */
  protected handleError(res: Response, error: unknown, statusCode: number = 500): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }

  /**
   * Send success response
   * @param res - Express response object
   * @param data - Data to send in response
   * @param message - Optional success message
   * @param statusCode - HTTP status code (default: 200)
   */
  protected sendSuccess(
    res: Response,
    data: any,
    message?: string,
    statusCode: number = 200
  ): void {
    const response: any = {
      success: true,
      data,
    };
    if (message) {
      response.message = message;
    }
    res.status(statusCode).json(response);
  }

  // ==================== CRUD OPERATIONS ====================

  /**
   * GET / - List all records
   * @example GET /api/users
   */
  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.service.findAll();
      this.sendSuccess(res, data);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /:id - Get a single record by ID
   * @example GET /api/users/123
   */
  async findOne(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = await this.service.findOne(id);
      
      if (!data) {
        res.status(404).json({
          success: false,
          error: 'Record not found',
        });
        return;
      }
      
      this.sendSuccess(res, data);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST / - Create a new record
   * @example POST /api/users
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.service.create(req.body);
      this.sendSuccess(res, data, 'Record created successfully', 201);
    } catch (error) {
      this.handleError(res, error, 400);
    }
  }

  /**
   * PUT /:id - Update a record by ID
   * @example PUT /api/users/123
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = await this.service.update(id, req.body);
      
      if (!data) {
        res.status(404).json({
          success: false,
          error: 'Record not found',
        });
        return;
      }
      
      this.sendSuccess(res, data, 'Record updated successfully');
    } catch (error) {
      this.handleError(res, error, 400);
    }
  }

  /**
   * DELETE /:id - Delete a record by ID
   * @example DELETE /api/users/123
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.service.delete(id);
      this.sendSuccess(res, null, 'Record deleted successfully');
    } catch (error) {
      this.handleError(res, error, 400);
    }
  }

  /**
   * DELETE /:id/soft - Soft delete a record by ID
   * @example DELETE /api/users/123/soft
   */
  async softDelete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = await this.service.softDelete(id);
      this.sendSuccess(res, data, 'Record soft deleted successfully');
    } catch (error) {
      this.handleError(res, error, 400);
    }
  }

  // ==================== BATCH OPERATIONS ====================

  /**
   * POST /batch - Create multiple records
   * @example POST /api/users/batch
   */
  async createMany(req: Request, res: Response): Promise<void> {
    try {
      const { items } = req.body;
      
      if (!Array.isArray(items)) {
        res.status(400).json({
          success: false,
          error: 'Request body must contain an "items" array',
        });
        return;
      }
      
      const result = await this.service.createMany(items);
      this.sendSuccess(res, result, `Created ${result.count} record(s)`, 201);
    } catch (error) {
      this.handleError(res, error, 400);
    }
  }

  /**
   * PUT /batch - Update multiple records
   * @example PUT /api/users/batch?status=active
   */
  async updateMany(req: Request, res: Response): Promise<void> {
    try {
      const where = req.query;
      const data = req.body;
      
      const result = await this.service.updateMany(where, data);
      this.sendSuccess(res, result, `Updated ${result.count} record(s)`);
    } catch (error) {
      this.handleError(res, error, 400);
    }
  }

  /**
   * DELETE /batch - Delete multiple records
   * @example DELETE /api/users/batch?status=inactive
   */
  async deleteMany(req: Request, res: Response): Promise<void> {
    try {
      const where = req.query;
      const result = await this.service.deleteMany(where);
      this.sendSuccess(res, result, `Deleted ${result.count} record(s)`);
    } catch (error) {
      this.handleError(res, error, 400);
    }
  }

  /**
   * POST /batch/soft-delete - Soft delete multiple records by IDs
   * @example POST /api/users/batch/soft-delete
   * Body: { "ids": ["id1", "id2", "id3"] }
   */
  async softDeleteMany(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids)) {
        res.status(400).json({
          success: false,
          error: 'Request body must contain an "ids" array',
        });
        return;
      }
      
      const result = await this.service.softDeleteMany(ids);
      this.sendSuccess(res, result, `Soft deleted ${result.count} record(s)`);
    } catch (error) {
      this.handleError(res, error, 400);
    }
  }

  // ==================== SEARCH & FILTER ====================

  /**
   * POST /search - Search records with filters
   * @example POST /api/users/search
   * Body: { "status": "active", "role": "admin" }
   */
  async search(req: Request, res: Response): Promise<void> {
    try {
      const where = req.body;
      const data = await this.service.findMany(where);
      this.sendSuccess(res, data);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /count - Count records with optional filter
   * @example GET /api/users/count?status=active
   */
  async count(req: Request, res: Response): Promise<void> {
    try {
      const where = req.query;
      const count = await this.service.findMany(where).then(items => items.length);
      this.sendSuccess(res, { count });
    } catch (error) {
      this.handleError(res, error);
    }
  }
}
