
import { Request, Response } from 'express';
import { AIKeyDto, AIKeyModel } from '../interfaces';
import { aiKeyService, AIKeyService } from './../services';
import { BaseController } from './base.controller';

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

  get aiKeyService(): AIKeyService {
    return this.service as AIKeyService;
  }

  /**
   * GET /ai-apiKeys/user/:userId - Get AI apiKeys by user ID
   */
  async getAIKeysByUserId(request: Request, response: Response): Promise<void> {
    try {
      const { userId } = request.params;
      const apiKeys = await this.aiKeyService.getAIKeysByUserId(userId);
      this.sendSuccess(response, apiKeys);
    } catch (error) {
      this.handleError(response, error);
    }
  }

  /**
   * GET /ai-apiKeys/active - Get all active AI apiKeys
   */
  async getActiveAIKeys(request: Request, response: Response): Promise<void> {
    try {
      const apiKeys = await this.aiKeyService.getActiveAIKeys();
      this.sendSuccess(response, apiKeys);
    } catch (error) {
      this.handleError(response, error);
    }
  }

  /**
   * GET /ai-apiKeys/by-key/:key - Find AI key by key value
   */
  async findByKey(request: Request, response: Response): Promise<void> {
    try {
      const { key } = request.params;
      const aiKey = await this.aiKeyService.findByKey(key);

      if (!aiKey) {
        response.status(404).json({
          success: false,
          error: 'AI Key not found',
        });
        return;
      }

      this.sendSuccess(response, aiKey);
    } catch (error) {
      this.handleError(response, error);
    }
  }

  /**
   * Override findAll to use the service's custom getAIKeys method
   * which includes related data (platform, billing, agents, user)
   */
  async findAll(request: Request, response: Response): Promise<void> {
    try {
      const apiKeys = await this.aiKeyService.getAIKeys();
      this.sendSuccess(response, apiKeys);
    } catch (error) {
      this.handleError(response, error);
    }
  }

  /**
   * Override findOne to use the service's custom getAIKeyById method
   * which includes related data
   */
  async findOne(request: Request, response: Response): Promise<void> {
    try {
      const { id } = request.params;
      const key = await this.aiKeyService.getAIKeyById(id);

      if (!key) {
        response.status(404).json({
          success: false,
          error: 'AI Key not found',
        });
        return;
      }

      this.sendSuccess(response, key);
    } catch (error) {
      this.handleError(response, error);
    }
  }

  public override async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const payload = req.body;
      const data = await this.aiKeyService.updateAIKey(id, payload);

      if (!data) {
        res.status(404).json({
          success: false,
          error: 'Record not found',
        });
        return;
      }
      this.sendSuccess(res, { data });
    } catch (error) {
      this.handleError(res, error, 400);
    }
  }

      /**
   * GET /ai-apiKeys/agent/:agentId - Get AI key used by a specific agent
   */
  // async getAIKeyByAgentId(request: Request, response: Response): Promise<void> {
  //   try {
  //     const { agentId } = request.params;
  //     // You need to implement this in the service: aiKeyService.getAIKeyByAgentId(agentId)
  //     const aiKey = await this.aiKeyService.getAIKeyByAgentId(agentId);
  //     if (!aiKey) {
  //       response.status(404).json({
  //         success: false,
  //         error: 'AI Key not found for agent',
  //       });
  //       return;
  //     }
  //     this.sendSuccess(response, aiKey);
  //   } catch (error) {
  //     this.handleError(response, error);
  //   }
  // }
}

// Export an instance of the controller
export const aiKeyController = new AIKeyController();
