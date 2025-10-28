import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { AgentService } from '../services/agent.service';
import { AgentDto } from '../dto/agent.dto';

export class AgentController extends BaseController<any, AgentDto, AgentDto> {
  private agentService: AgentService;

  constructor() {
    const agentService = new AgentService();
    super(agentService);
    this.agentService = agentService;
  }

  /**
   * GET /agents - Get all agents for authenticated user
   */
  async getUserAgents(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        this.handleError(res, 'User not authenticated', 401);
        return;
      }

      const { page = '1', limit = '10', search = '', q = '' } = req.query;
      const searchTerm = (q as string) || (search as string) || '';
      const currentPage = Math.max(1, parseInt(page as string, 10));
      const currentLimit = Math.max(1, Math.min(100, parseInt(limit as string, 10)));

      const result = await this.agentService.getUserAgents(userId, currentPage, currentLimit, searchTerm);
      this.sendSuccess(res, result.data);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /agents - Create new agent
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        this.handleError(res, 'User not authenticated', 401);
        return;
      }

      const { name, description, model, aiModelId, personality, systemPrompt, config } = req.body;
      if (!name) {
        this.handleError(res, 'Agent name is required', 400);
        return;
      }

      const agent = await this.agentService.createAgent({
        userId,
        name,
        description,
        model,
        aiModelId,
        personality,
        systemPrompt,
        config,
      });
      this.sendSuccess(res, agent);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /agents/:id - Get single agent by ID
   */
  async findOne(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        this.handleError(res, 'User not authenticated', 401);
        return;
      }

      const agent = await this.agentService.getAgentById(id);
      if (!agent || agent.user.id !== userId) {
        this.handleError(res, 'Agent not found', 404);
        return;
      }

      this.sendSuccess(res, agent);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * PUT /agents/:id - Update agent
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        this.handleError(res, 'User not authenticated', 401);
        return;
      }

      // Check if agent belongs to user
      const agent = await this.agentService.getAgentById(id);
      if (!agent || agent.user.id !== userId) {
        this.handleError(res, 'Agent not found', 404);
        return;
      }

      const { name, description, model, aiModelId, personality, systemPrompt, config, isActive } = req.body;
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (model !== undefined) updateData.model = model;
      if (aiModelId !== undefined) updateData.aiModelId = aiModelId;
      if (personality !== undefined) updateData.personality = personality;
      if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt;
      if (config !== undefined) updateData.config = config;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updatedAgent = await this.agentService.updateAgent(id, updateData);
      this.sendSuccess(res, updatedAgent);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * DELETE /agents/:id - Delete agent
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        this.handleError(res, 'User not authenticated', 401);
        return;
      }

      const agent = await this.agentService.getAgentById(id);
      if (!agent || agent.user.id !== userId) {
        this.handleError(res, 'Agent not found', 404);
        return;
      }

      await this.agentService.deleteAgent(id);
      this.sendSuccess(res, { message: 'Agent deleted successfully' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /agents/:id/memories - Add memory to agent
   */
  async addMemory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { type, content, metadata, importance = 1 } = req.body;

      if (!userId) {
        this.handleError(res, 'User not authenticated', 401);
        return;
      }

      const agent = await this.agentService.getAgentById(id);
      if (!agent || agent.user.id !== userId) {
        this.handleError(res, 'Agent not found', 404);
        return;
      }

      const memory = await this.agentService.addMemory(id, content, type, importance, metadata);
      this.sendSuccess(res, memory);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /agents/:id/memories - Get agent memories
   */
  async getMemories(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { type, page = '1', limit = '50' } = req.query;

      if (!userId) {
        this.handleError(res, 'User not authenticated', 401);
        return;
      }

      const agent = await this.agentService.getAgentById(id);
      if (!agent || agent.user.id !== userId) {
        this.handleError(res, 'Agent not found', 404);
        return;
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const result = await this.agentService.getAgentMemories(id, type as string, pageNum, limitNum);
      this.sendSuccess(res, result);
    } catch (error) {
      this.handleError(res, error);
    }
  }
}

// Export singleton instance
export const agentController = new AgentController();
