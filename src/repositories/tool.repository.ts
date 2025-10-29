import { ToolDro, ToolDto, ToolModel } from '../interfaces/tool.interface';
import { prisma } from '../setup';
import { BaseRepository } from './base.repository';

export class ToolRepository extends BaseRepository<ToolModel, ToolDto, ToolDro> {
  constructor(toolDelegate = prisma.tool) {
    super(toolDelegate);
  }

  async findByName(name: string) {
    return this.model.findUnique({ where: { name } });
  }

  async enableTool(agentId: string, name: string) {
    // Enable tool for a specific agent (many-to-many)
    return prisma.agentTool.updateMany({
      where: {
        agentId,
        tool: { name },
      },
      data: {
        /* add any agent-tool specific fields if needed */
      },
    });
  }

  async disableTool(agentId: string, name: string) {
    // Disable tool for a specific agent (many-to-many)
    return prisma.agentTool.updateMany({
      where: {
        agentId,
        tool: { name },
      },
      data: {
        /* add any agent-tool specific fields if needed */
      },
    });
  }

  async listAgentTools(agentId: string) {
    // List all tools for a specific agent (many-to-many)
    return prisma.agentTool.findMany({
      where: { agentId },
      include: {
        tool: {
          include: {
            commands: {
              where: { enabled: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        agent: {
          include: {
            model: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllWithAgents(name?: string) {
    // List all tools with their related agents
    return prisma.tool.findMany({
      where: name
        ? {
            name: {
              contains: name,
            },
          }
        : undefined,
      include: {
        agents: {
          include: {
            agent: {
              include: {
                model: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByIdWithAgents(id: string) {
    // Find a specific tool with its related agents
    if (!id) {
      throw new Error('Tool ID is required');
    }

    return prisma.tool.findUnique({
      where: { id: id },
      include: {
        commands: true,
        agents: true,
      },
    });
  }

  async bulkEnableTools(agentId: string, toolIds: string[]) {
    // Get tool names from IDs
    const tools = await prisma.tool.findMany({
      where: { id: { in: toolIds } },
      select: { id: true, name: true },
    });

    const results = [];
    
    for (const tool of tools) {
      try {
        // Check if agent-tool relation already exists
        const existingRelation = await prisma.agentTool.findFirst({
          where: {
            agentId,
            toolId: tool.id,
          },
        });

        if (!existingRelation) {
          // Create the agent-tool relation if it doesn't exist
          await prisma.agentTool.create({
            data: {
              agentId,
              toolId: tool.id,
            },
          });
        }

        results.push({ action: 'enabled' as const, tool: tool.name, toolId: tool.id });
      } catch (error) {
        console.error(`Failed to enable tool ${tool.name}:`, error);
        results.push({ action: 'failed' as const, tool: tool.name, toolId: tool.id, error: 'Enable failed' });
      }
    }

    return results;
  }

  async bulkDisableTools(agentId: string, toolIds: string[]) {
    // Get tool names from IDs
    const tools = await prisma.tool.findMany({
      where: { id: { in: toolIds } },
      select: { id: true, name: true },
    });

    const results = [];

    for (const tool of tools) {
      try {
        // Remove the agent-tool relation
        await prisma.agentTool.deleteMany({
          where: {
            agentId,
            toolId: tool.id,
          },
        });

        results.push({ action: 'disabled' as const, tool: tool.name, toolId: tool.id });
      } catch (error) {
        console.error(`Failed to disable tool ${tool.name}:`, error);
        results.push({ action: 'failed' as const, tool: tool.name, toolId: tool.id, error: 'Disable failed' });
      }
    }

    return results;
  }

  async getCurrentAgentToolIds(agentId: string): Promise<string[]> {
    const agentTools = await prisma.agentTool.findMany({
      where: { agentId },
      select: { toolId: true },
    });
    return agentTools.map(at => at.toolId);
  }
}

export const toolRepository = new ToolRepository();