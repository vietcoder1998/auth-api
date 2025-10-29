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
}

export const toolRepository = new ToolRepository();