import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { AgentTaskDto, AgentTaskModel } from '../interfaces';

export class AgentTaskRepository extends BaseRepository<AgentTaskModel, AgentTaskDto, AgentTaskDto> {
    constructor(agentTaskDelegate = prisma.agentTask) {
        super(agentTaskDelegate);
    }

    async findByAgentId(agentId: string) {
        return this.model.findMany({ 
            where: { agentId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findByStatus(agentId: string, status: string) {
        return this.model.findMany({ 
            where: { agentId, status },
            orderBy: { createdAt: 'desc' }
        });
    }

    async updateStatus(id: string, status: string) {
        return this.model.update({
            where: { id },
            data: { status }
        });
    }
}
