import { PrismaClient, Tool as PrismaTool } from '@prisma/client';

export type ToolModel = PrismaClient['tool'];

export interface ToolDro extends Omit<PrismaTool, 'id' | 'createdAt' | 'updatedAt'> { }
export interface ToolDto extends ToolDro {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}