import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { ToolModel, ToolDto, ToolDro } from '../interfaces/tool.interface';

export class ToolRepository extends BaseRepository<ToolModel, ToolDto, ToolDro> {
    constructor(toolDelegate = prisma.tool) {
        super(toolDelegate);
    }

    async enableTool(agentId: string, name: string) {
        return this.model.updateMany({
            where: { agentId, name },
            data: { enabled: true },
        });
    }

    async disableTool(agentId: string, name: string) {
        return this.model.updateMany({
            where: { agentId, name },
            data: { enabled: false },
        });
    }

    async listAgentTools(agentId: string) {
        return this.model.findMany({
            where: { agentId },
            orderBy: { createdAt: 'desc' },
        });
    }
}
