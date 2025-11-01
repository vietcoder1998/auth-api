import { PrismaClient, AgentMemory as PrismaAgentMemory } from '@prisma/client';

export type AgentMemoryModel = PrismaClient['agentMemory'];
export type AgentMemoryType = 'short_term' | 'long_term' | 'knowledge_base';

export interface AgentMemoryDto extends Partial<Omit<AgentMemoryModel, 'id' | 'createdAt' | 'updatedAt'>> {
    type: AgentMemoryType;
}
export interface AgentMemoryDro extends AgentMemoryDto {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    content: string
}


export interface CreateMemoryDto extends Omit<AgentMemoryDto, 'id' | 'createdAt' | 'updatedAt' | 'type'> {
    type: AgentMemoryType;
}
