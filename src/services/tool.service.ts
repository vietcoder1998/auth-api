import { ToolRepository } from '../repositories/tool.repository';

import { ToolDro, ToolDto, ToolModel } from '../interfaces';
import { BaseService } from './base.service';

export class ToolService extends BaseService<ToolModel, ToolDto, ToolDro> {
  private toolRepository: ToolRepository;

  constructor() {
    const toolRepository = new ToolRepository();
    super(toolRepository);
    this.toolRepository = toolRepository;
  }

  // Add custom methods if needed, e.g. list by agentId with config parsing
  async listTools(agentId?: string): Promise<ToolModel[]> {
    if (agentId) {
      const tools = await this.toolRepository.listAgentTools(agentId);
      return tools.map((tool: any) => ({
        ...tool,
        config: tool.config ? JSON.parse(tool.config) : null,
      }));
    } else {
      // fallback: list all tools
      const tools = await this.toolRepository.findMany();
      return tools.map((tool: any) => ({
        ...tool,
        config: tool.config ? JSON.parse(tool.config) : null,
      }));
    }
  }
}

export const toolService = new ToolService();
