import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { AgentMemoryDto, AgentMemoryModel } from '../interfaces';

export class AgentMemoryRepository extends BaseRepository<AgentMemoryModel, AgentMemoryDto, AgentMemoryDto> {
    constructor(agentMemoryDelegate = prisma.agentMemory) {
        super(agentMemoryDelegate);
    }

    async findByAgentId(agentId: string) {
        return this.model.findMany({ 
            where: { agentId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findByType(agentId: string, type: string) {
        return this.model.findMany({ 
            where: { agentId, type },
            orderBy: { createdAt: 'desc' }
        });
    }
}
