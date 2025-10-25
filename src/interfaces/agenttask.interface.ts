import { PrismaClient, AgentTask as PrismaAgentTask } from '@prisma/client';

export type AgentTaskModel = PrismaClient['agentTask'];

export interface AgentTaskDro extends Omit<PrismaAgentTask, 'id' | 'createdAt' | 'updatedAt'> {}
export interface AgentTaskDto extends AgentTaskDro {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
