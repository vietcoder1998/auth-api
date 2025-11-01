import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { aiKeyService } from '../services/aiKey.service';
import { AIKeyModel, AIKeyDto } from '../interfaces';

/**
 * AIKeyController - Handles API key management endpoints
 * 
 * Extends BaseController to provide standard CRUD operations
 * plus custom endpoints for AI key specific functionality.
 */
export class AIKeyController extends BaseController<AIKeyModel, AIKeyDto, AIKeyDto> {
  constructor() {
    super(aiKeyService);
  }

  /**
   * GET /ai-keys/user/:userId - Get AI keys by user ID
   */
  async getAIKeysByUserId(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const keys = await aiKeyService.getAIKeysByUserId(userId);
      this.sendSuccess(res, keys);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /ai-keys/active - Get all active AI keys
   */
  async getActiveAIKeys(req: Request, res: Response): Promise<void> {
    try {
      const keys = await aiKeyService.getActiveAIKeys();
      this.sendSuccess(res, keys);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /ai-keys/by-key/:key - Find AI key by key value
   */
  async findByKey(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const aiKey = await aiKeyService.findByKey(key);
      
      if (!aiKey) {
        res.status(404).json({
          success: false,
          error: 'AI Key not found',
        });
        return;
      }
      
      this.sendSuccess(res, aiKey);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Override findAll to use the service's custom getAIKeys method
   * which includes related data (platform, billing, agents, user)
   */
  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const keys = await aiKeyService.getAIKeys();
      this.sendSuccess(res, keys);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Override findOne to use the service's custom getAIKeyById method
   * which includes related data
   */
  async findOne(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const key = await aiKeyService.getAIKeyById(id);
      
      if (!key) {
        res.status(404).json({
          success: false,
          error: 'AI Key not found',
        });
        return;
      }
      
      this.sendSuccess(res, key);
    } catch (error) {
      this.handleError(res, error);
    }
  }
}

// Export an instance of the controller
export const aiKeyController = new AIKeyController();
