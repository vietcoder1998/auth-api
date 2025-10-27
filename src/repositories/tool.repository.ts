import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { ToolModel, ToolDto, ToolDro } from '../interfaces/tool.interface';

export class ToolRepository extends BaseRepository<ToolModel, ToolDto, ToolDro> {
    constructor(toolDelegate = prisma.tool) {
        super(toolDelegate);
    }

    async enableTool(agentId: string, name: string) {
        // Enable tool for a specific agent (many-to-many)
        return prisma.agentTool.updateMany({
            where: {
                agentId,
                tool: { name },
            },
            data: { /* add any agent-tool specific fields if needed */ },
        });
    }

    async disableTool(agentId: string, name: string) {
        // Disable tool for a specific agent (many-to-many)
        return prisma.agentTool.updateMany({
            where: {
                agentId,
                tool: { name },
            },
            data: { /* add any agent-tool specific fields if needed */ },
        });
    }

    async listAgentTools(agentId: string) {
        // List all tools for a specific agent (many-to-many)
        return prisma.agentTool.findMany({
            where: { agentId },
            include: { tool: true },
            orderBy: { createdAt: 'desc' },
        });
    }
}
