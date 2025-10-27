import { ToolRepository } from '../repositories/tool.repository';

import { ToolDro, ToolDto, ToolModel } from '../interfaces';
import { BaseService } from './base.service';

/**
 * ToolService - Business logic layer for Tool operations
 * 
 * Provides tool management operations including enabling/disabling tools,
 * listing tools for specific agents, and parsing tool configurations.
 * 
 * @extends BaseService<ToolModel, ToolDto, ToolDro>
 * 
 * @example
 * ```typescript
 * const toolService = new ToolService();
 * 
 * // Enable a tool for an agent
 * await toolService.enableTool('agent-123', 'code-analyzer');
 * 
 * // List all tools for an agent
 * const agentTools = await toolService.listAgentTools('agent-123');
 * ```
 */
export class ToolService extends BaseService<ToolModel, ToolDto, ToolDro> {
  private _toolRepository: ToolRepository;

  /**
   * Creates a new ToolService instance
   * Initializes with ToolRepository for data access
   */
  constructor() {
    const toolRepository = new ToolRepository();
    super(toolRepository);
    this._toolRepository = toolRepository;
  }

  get toolRepository(): ToolRepository {
    return this._toolRepository;
  }
  /**
   * List tools with optional filtering by agentId
   * Automatically parses JSON config field and includes agent relations
   * @param agentId - Optional agent ID to filter tools
   * @returns Array of tools with parsed config and agent relations
   * @example
   * ```typescript
   * // List all tools with their agents
   * const allTools = await toolService.listTools();
   * 
   * // List tools for specific agent
   * const agentTools = await toolService.listTools('agent-123');
   * ```
   */
  async listTools(name?: string, agentId?: string): Promise<any[]> {
    if (agentId) {
      const agentTools = await this.toolRepository.listAgentTools(agentId);
      return agentTools.map((at: any) => ({
        ...at.tool,
        config: at.tool.config ? JSON.parse(at.tool.config as string) : null,
        agents: [{
          id: at.agent.id,
          name: at.agent.name,
          description: at.agent.description,
          model: at.agent.model,
          createdAt: at.createdAt,
        }]
      }));
    } else {
      // List all tools with their agents
      const tools = await this.toolRepository.findAllWithAgents();
      return tools.map((tool: any) => ({
        ...tool,
        config: tool.config ? JSON.parse(tool.config as string) : null,
        agents: tool.agents.map((at: any) => ({
          id: at.agent.id,
          name: at.agent.name,
          description: at.agent.description,
          model: at.agent.model,
          createdAt: at.createdAt,
        }))
      }));
    }
  }

  /**
   * Enable a specific tool for an agent
   * @param agentId - The ID of the agent
   * @param name - The name of the tool to enable
   * @returns Update result with count of modified records
   * @example
   * ```typescript
   * const result = await toolService.enableTool('agent-123', 'web-search');
   * console.log(`Enabled ${result.count} tool(s)`);
   * ```
   */
  async enableTool(agentId: string, name: string): Promise<{ count: number }> {
    return this.toolRepository.enableTool(agentId, name);
  }

  /**
   * Disable a specific tool for an agent
   * @param agentId - The ID of the agent
   * @param name - The name of the tool to disable
   * @returns Update result with count of modified records
   * @example
   * ```typescript
   * const result = await toolService.disableTool('agent-123', 'web-search');
   * console.log(`Disabled ${result.count} tool(s)`);
   * ```
   */
  async disableTool(agentId: string, name: string): Promise<{ count: number }> {
    return this.toolRepository.disableTool(agentId, name);
  }

  /**
   * List all tools associated with a specific agent
   * Ordered by creation date (newest first)
   * Includes agent and model information
   * @param agentId - The ID of the agent
   * @returns Array of tools belonging to the agent with agent details
   * @example
   * ```typescript
   * const tools = await toolService.listAgentTools('agent-123');
   * tools.forEach(tool => {
   *   console.log(`${tool.name}: Agent ${tool.agents[0].name}`);
   * });
   * ```
   */
  async listAgentTools(agentId: string): Promise<any[]> {
    const agentTools = await this.toolRepository.listAgentTools(agentId);
    return agentTools.map((at: any) => ({
      ...at.tool,
      config: at.tool.config ? JSON.parse(at.tool.config as string) : null,
      agents: [{
        id: at.agent.id,
        name: at.agent.name,
        description: at.agent.description,
        model: at.agent.model,
        createdAt: at.createdAt,
      }]
    }));
  }

  /**
   * Find tools by name (supports partial matching)
   * @param name - The tool name or partial name to search for
   * @returns Array of matching tools
   * @example
   * ```typescript
   * const searchTools = await toolService.findByName('search');
   * // Returns all tools with 'search' in their name
   * ```
   */
  async findByName(name: string): Promise<ToolDro[]> {
    return this.toolRepository.findMany<ToolDro>({
      name: { contains: name },
    });
  }

  /**
   * Find enabled tools for an agent
   * @param agentId - The ID of the agent
   * @returns Array of enabled tools
   * @example
   * ```typescript
   * const enabledTools = await toolService.findEnabledTools('agent-123');
   * ```
   */
  async findEnabledTools(agentId: string): Promise<ToolDro[]> {
    return this.toolRepository.findMany<ToolDro>({
      agentId,
      enabled: true,
    });
  }

  /**
   * Find disabled tools for an agent
   * @param agentId - The ID of the agent
   * @returns Array of disabled tools
   * @example
   * ```typescript
   * const disabledTools = await toolService.findDisabledTools('agent-123');
   * ```
   */
  async findDisabledTools(agentId: string): Promise<ToolDro[]> {
    return this.toolRepository.findMany<ToolDro>({
      agentId,
      enabled: false,
    });
  }

  /**
   * Toggle tool enabled status
   * @param agentId - The ID of the agent
   * @param name - The name of the tool
   * @returns The updated tool or null if not found
   * @example
   * ```typescript
   * const tool = await toolService.toggleTool('agent-123', 'web-search');
   * if (tool) {
   *   console.log(`Tool is now ${tool.enabled ? 'enabled' : 'disabled'}`);
   * }
   * ```
   */
  async toggleTool(agentId: string, name: string): Promise<ToolDro | null> {
    // First, find the tool
    const tools = await this.repository.findMany<ToolDro>({
      agentId,
      name,
    });

    if (!tools || tools.length === 0) {
      return null;
    }

    const tool = tools[0];
    const newStatus = !tool.enabled;

    // Update the tool
    if (newStatus) {
      await this.enableTool(agentId, name);
    } else {
      await this.disableTool(agentId, name);
    }

    // Return updated tool
    const updatedTools = await this.repository.findMany<ToolDro>({ agentId, name });
    return updatedTools.length > 0 ? updatedTools[0] : null;
  }

  /**
   * Count tools for a specific agent
   * @param agentId - The ID of the agent
   * @param enabledOnly - If true, count only enabled tools
   * @returns Count of tools
   * @example
   * ```typescript
   * const totalTools = await toolService.countAgentTools('agent-123');
   * const enabledTools = await toolService.countAgentTools('agent-123', true);
   * ```
   */
  async countAgentTools(agentId: string, enabledOnly: boolean = false): Promise<number> {
    const where: Record<string, any> = { agentId };
    if (enabledOnly) {
      where.enabled = true;
    }
    return this.toolRepository.count(where);
  }

  /**
   * Enable all tools for an agent
   * @param agentId - The ID of the agent
   * @returns Update result with count of modified records
   * @example
   * ```typescript
   * const result = await toolService.enableAllTools('agent-123');
   * console.log(`Enabled ${result.count} tool(s)`);
   * ```
   */
  async enableAllTools(agentId: string): Promise<{ count: number }> {
    return this.toolRepository.updateMany<ToolDto, { count: number }>(
      { agentId },
      { enabled: true } as Partial<ToolDto>
    );
  }

  /**
   * Disable all tools for an agent
   * @param agentId - The ID of the agent
   * @returns Update result with count of modified records
   * @example
   * ```typescript
   * const result = await toolService.disableAllTools('agent-123');
   * console.log(`Disabled ${result.count} tool(s)`);
   * ```
   */
  async disableAllTools(agentId: string): Promise<{ count: number }> {
    return this.toolRepository.updateMany<ToolDto, { count: number }>(
      { agentId },
      { enabled: false } as Partial<ToolDto>
    );
  }

  /**
   * Find tools by type
   * @param type - The tool type to search for
   * @returns Array of tools matching the type
   * @example
   * ```typescript
   * const apiTools = await toolService.findByType('api');
   * ```
   */
  async findByType(type: string): Promise<ToolDro[]> {
    return this.toolRepository.findMany<ToolDro>({ type });
  }

  /**
   * Delete all tools for a specific agent
   * @param agentId - The ID of the agent
   * @returns Delete result with count of deleted records
   * @example
   * ```typescript
   * const result = await toolService.deleteAgentTools('agent-123');
   * console.log(`Deleted ${result.count} tool(s)`);
   * ```
   */
  async deleteAgentTools(agentId: string): Promise<{ count: number }> {
    return this.toolRepository.deleteMany<{ count: number }>({ agentId });
  }

  /**
   * Find global tools (tools not associated with any agent)
   * @returns Array of global tools
   * @example
   * ```typescript
   * const globalTools = await toolService.findGlobalTools();
   * ```
   */
  async findGlobalTools(): Promise<ToolDro[]> {
    return this.toolRepository.findMany<ToolDro>({
      agentId: null,
    });
  }

  /**
   * Check if a tool exists for an agent
   * @param agentId - The ID of the agent
   * @param name - The name of the tool
   * @returns True if the tool exists, false otherwise
   * @example
   * ```typescript
   * const hasWebSearch = await toolService.hasTool('agent-123', 'web-search');
   * ```
   */
  async hasTool(agentId: string, name: string): Promise<boolean> {
    return this.toolRepository.exists({ agentId, name });
  }

  async findOne(toolId: string): Promise<ToolDro | null> {
    return this.toolRepository.findByIdWithAgents(toolId)
  }
}

export const toolService = new ToolService();
