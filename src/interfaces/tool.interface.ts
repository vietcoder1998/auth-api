import { PrismaClient, Tool as PrismaTool } from '@prisma/client';
import { GetResult } from '@prisma/client/runtime/library';
import { AgentModel } from './agent.interface';
import { CommandModel } from './command.interface';

export type ToolModel = PrismaClient['tool'];
export interface ToolDto extends ToolModel {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    enabled?: boolean;
}
export interface ToolDro extends Omit<ToolDto, 'createdAt' | 'updatedAt'> { }

export type ToolResult = GetResult<ToolModel, {}> & {
  agents: GetResult<AgentModel[], {}> & {}
  commands: GetResult<CommandModel[], {}> & ToolDto
};

