import { PrismaClient, Agent as PrismaAgent } from '@prisma/client';

export type AgentModel = PrismaClient['agent'];

export interface AgentDro extends Omit<PrismaAgent, 'id' | 'createdAt' | 'updatedAt'> {}
export interface AgentDto extends AgentDro {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
