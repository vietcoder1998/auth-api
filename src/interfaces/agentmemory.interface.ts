import { PrismaClient, AgentMemory as PrismaAgentMemory } from '@prisma/client';

export type AgentMemoryModel = PrismaClient['agentMemory'];

export interface AgentMemoryDro extends Omit<PrismaAgentMemory, 'id' | 'createdAt' | 'updatedAt'> {}
export interface AgentMemoryDto extends AgentMemoryDro {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
