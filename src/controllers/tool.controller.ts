import { Request, Response } from 'express';
import { toolService } from '../services/tool.service';
import { BaseController } from './base.controller';
import { ToolModel, ToolDto, ToolDro } from '../interfaces';

/**
 * ToolController - HTTP request handlers for Tool operations
 * Extends BaseController to inherit common CRUD operations
 */
class ToolController extends BaseController<ToolModel, ToolDto, ToolDro> {
  constructor() {
    super(toolService);
  }

  /**
   * Override create to transform payload for Prisma compatibility
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      let data = req.body;

      // Stringify config if it's an object
      if (data.config && typeof data.config === 'object') {
        data.config = JSON.stringify(data.config);
      }

      // Map agent relations if present (many-to-many via AgentTool)
      if (data.relatedAgentIds && Array.isArray(data.relatedAgentIds)) {
        data.agents = {
          create: data.relatedAgentIds.map((agentId: string) => ({
            agent: { connect: { id: agentId } }
          }))
        };
        delete data.relatedAgentIds;
      }

      const result = await this.service.create(data);
      this.sendSuccess(res, result, 'Tool created successfully', 201);
    } catch (error) {
      this.handleError(res, error, 400);
    }
  }

  /**
   * Override update to transform payload for Prisma compatibility
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      let data = req.body;

      // Stringify config if it's an object
      if (data.config && typeof data.config === 'object') {
        data.config = JSON.stringify(data.config);
      }

      // Map agent relations if present (many-to-many via AgentTool)
      if (data.relatedAgentIds && Array.isArray(data.relatedAgentIds)) {
        // For many-to-many relationship, we need to use agents (not agent)
        // and create/connect through the AgentTool junction table
        data.agents = {
          deleteMany: {}, // First remove all existing relations
          create: data.relatedAgentIds.map((agentId: string) => ({
            agent: { connect: { id: agentId } }
          }))
        };
        delete data.relatedAgentIds;
      }

      // Remove any fields not in ToolUpdateInput if needed

      const result = await this.service.update(id, data);
      this.sendSuccess(res, result);
    } catch (error) {
      this.handleError(res, error, 400);
    }
  }

  /**
   * List all tools (optionally filtered by agentId)
   * GET /api/tools?agentId=xxx
   */
  async listTools(req: Request, res: Response): Promise<void> {
    try {
      const { agentId } = req.query;
      const tools = await toolService.listTools(agentId as string | undefined);
      this.sendSuccess(res, tools);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Enable a specific tool for an agent
   * PUT /api/tools/agent/:agentId/enable/:name
   */
  async enableTool(req: Request, res: Response): Promise<void> {
    try {
      const { agentId, name } = req.params;
      const result = await toolService.enableTool(agentId, name);
      this.sendSuccess(res, result, `Enabled ${result.count} tool(s)`);
    } catch (error) {
      this.handleError(res, error, 400);
    }
  }

  /**
   * Disable a specific tool for an agent
   * PUT /api/tools/agent/:agentId/disable/:name
   */
  async disableTool(req: Request, res: Response): Promise<void> {
    try {
      const { agentId, name } = req.params;
      const result = await toolService.disableTool(agentId, name);
      this.sendSuccess(res, result, `Disabled ${result.count} tool(s)`);
    } catch (error) {
      this.handleError(res, error, 400);
    }
  }

  /**
   * Toggle tool enabled status
   * PUT /api/tools/agent/:agentId/toggle/:name
   */
  async toggleTool(req: Request, res: Response): Promise<void> {
    try {
      const { agentId, name } = req.params;
      const tool = await toolService.toggleTool(agentId, name);
      if (!tool) {
        res.status(404).json({ success: false, error: 'Tool not found' });
        return;
      }
      this.sendSuccess(
        res,
        tool,
        `Tool is now ${tool.enabled ? 'enabled' : 'disabled'}`
      );
    } catch (error) {
      this.handleError(res, error, 400);
    }
  }

  /**
   * List all tools for a specific agent
   * GET /api/tools/agent/:agentId
   */
  async listAgentTools(req: Request, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      const tools = await toolService.listAgentTools(agentId);
      this.sendSuccess(res, tools);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Get enabled tools for an agent
   * GET /api/tools/agent/:agentId/enabled
   */
  async getEnabledTools(req: Request, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      const tools = await toolService.findEnabledTools(agentId);
      this.sendSuccess(res, tools);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Get disabled tools for an agent
   * GET /api/tools/agent/:agentId/disabled
   */
  async getDisabledTools(req: Request, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      const tools = await toolService.findDisabledTools(agentId);
      this.sendSuccess(res, tools);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Count tools for an agent
   * GET /api/tools/agent/:agentId/count?enabledOnly=true
   */
  async countAgentTools(req: Request, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      const enabledOnly = req.query.enabledOnly === 'true';
      const count = await toolService.countAgentTools(agentId, enabledOnly);
      this.sendSuccess(res, { count });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Enable all tools for an agent
   * PUT /api/tools/agent/:agentId/enable-all
   */
  async enableAllTools(req: Request, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      const result = await toolService.enableAllTools(agentId);
      this.sendSuccess(res, result, `Enabled ${result.count} tool(s)`);
    } catch (error) {
      this.handleError(res, error, 400);
    }
  }

  /**
   * Disable all tools for an agent
   * PUT /api/tools/agent/:agentId/disable-all
   */
  async disableAllTools(req: Request, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      const result = await toolService.disableAllTools(agentId);
      this.sendSuccess(res, result, `Disabled ${result.count} tool(s)`);
    } catch (error) {
      this.handleError(res, error, 400);
    }
  }

  /**
   * Find tools by name (partial matching)
   * GET /api/tools/search?name=xxx
   */
  async searchToolsByName(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.query;
      if (!name) {
        res.status(400).json({ success: false, error: 'Name query parameter is required' });
        return;
      }
      const tools = await toolService.findByName(name as string);
      this.sendSuccess(res, tools);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Find tools by type
   * GET /api/tools/type/:type
   */
  async getToolsByType(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      const tools = await toolService.findByType(type);
      this.sendSuccess(res, tools);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Get global tools (not associated with any agent)
   * GET /api/tools/global
   */
  async getGlobalTools(req: Request, res: Response): Promise<void> {
    try {
      const tools = await toolService.findGlobalTools();
      this.sendSuccess(res, tools);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Delete all tools for a specific agent
   * DELETE /api/tools/agent/:agentId
   */
  async deleteAgentTools(req: Request, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      const result = await toolService.deleteAgentTools(agentId);
      this.sendSuccess(res, result, `Deleted ${result.count} tool(s)`);
    } catch (error) {
      this.handleError(res, error, 400);
    }
  }

  /**
   * Check if a tool exists for an agent
   * GET /api/tools/agent/:agentId/has/:name
   */
  async hasToolForAgent(req: Request, res: Response): Promise<void> {
    try {
      const { agentId, name } = req.params;
      const exists = await toolService.hasTool(agentId, name);
      this.sendSuccess(res, { exists });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Get a single tool by ID with all related agents
   * GET /api/tools/:id/with-agents
   */
  async getToolWithAgents(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tool = await toolService.getToolWithAgents(id);
      if (!tool) {
        res.status(404).json({ success: false, error: 'Tool not found' });
        return;
      }
      this.sendSuccess(res, tool);
    } catch (error) {
      this.handleError(res, error);
    }
  }
}

// Create instance and export individual methods for route binding
const toolController = new ToolController();

export const listTools = toolController.listTools.bind(toolController);
export const getTool = toolController.findOne.bind(toolController);
export const getToolWithAgents = toolController.getToolWithAgents.bind(toolController);
export const createTool = toolController.create.bind(toolController);
export const updateTool = toolController.update.bind(toolController);
export const deleteTool = toolController.delete.bind(toolController);
export const enableTool = toolController.enableTool.bind(toolController);
export const disableTool = toolController.disableTool.bind(toolController);
export const toggleTool = toolController.toggleTool.bind(toolController);
export const listAgentTools = toolController.listAgentTools.bind(toolController);
export const getEnabledTools = toolController.getEnabledTools.bind(toolController);
export const getDisabledTools = toolController.getDisabledTools.bind(toolController);
export const countAgentTools = toolController.countAgentTools.bind(toolController);
export const enableAllTools = toolController.enableAllTools.bind(toolController);
export const disableAllTools = toolController.disableAllTools.bind(toolController);
export const searchToolsByName = toolController.searchToolsByName.bind(toolController);
export const getToolsByType = toolController.getToolsByType.bind(toolController);
export const getGlobalTools = toolController.getGlobalTools.bind(toolController);
export const deleteAgentTools = toolController.deleteAgentTools.bind(toolController);
export const hasToolForAgent = toolController.hasToolForAgent.bind(toolController);