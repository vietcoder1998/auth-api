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

    async deleteByAgentId(agentId: string) {
        return (this.model as any).deleteMany({ 
            where: { agentId }
        });
    }

    async deleteByType(agentId: string, type: string) {
        return (this.model as any).deleteMany({ 
            where: { agentId, type }
        });
    }

    async searchByContent(agentId: string, query: string, limit: number = 10) {
        return (this.model as any).findMany({ 
            where: { 
                agentId,
                content: { contains: query }
            },
            orderBy: { importance: 'desc' },
            take: limit
        });
    }
}

export const agentMemoryRepository = new AgentMemoryRepository();