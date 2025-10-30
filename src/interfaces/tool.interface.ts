import { PrismaClient, Tool } from '@prisma/client';
import { GetResult } from '@prisma/client/runtime/library';
import { AgentModel } from './agent.interface';
import { CommandModel } from './command.interface';
import { ConversationModel } from './conversation.interface';

// ToolStep interface
export type ToolModel = PrismaClient['tool'];
export interface ToolDro extends Tool {
  toolCommands?: CommandModel[];
  toolContexts?: ToolContextModel[];
  agents?: AgentModel[];
  conversations?: ConversationModel[];
  targetPrompt?: PromptHistoryModel;
  toolSteps?: ToolStepModel[];
}

export interface ToolStepModel {
  id: string;
  commandId: string;
  stepIndex: number; // Order of the step in the plan
  position?: number; // Optional: explicit position field (alias for stepIndex)
  tool: string;
  toolType?: string;
  commandName: string;
  params?: string;
  toolModel?: ToolModel; // Reference to ToolModel (for richer step context)
  createdAt: Date;
  updatedAt: Date;
}

// ToolContext interface
export interface ToolContextModel {
  id: string;
  toolId: string;
  contextId: string;
  description?: string;
  executeTools: ExecutedToolModel[];
  createdAt: Date;
  updatedAt: Date;
}

// ExecutedToolModel (from diagram)
export interface ExecutedToolModel {
  type: ToolNameType;
  // Add other fields as needed
}

// ToolNameType enum (from diagram)
export enum ToolNameType {
  GenContext = 'gen_context',
  Planner = 'planner',
  PlayPlanner = 'playplanner',
  AdjustExecution = 'adjust_execution',
  Execute = 'execute',
}

// Expanded ToolModel per diagram, extends PrismaClient['tool']
import { PromptHistoryModel } from './prompthistory.interface';

export interface ToolDto extends ToolModel {}
export interface ToolDro extends Omit<ToolDto, 'createdAt' | 'updatedAt'> {}

export type ToolResult = GetResult<ToolModel, {}> & {
  agents: GetResult<AgentModel[], {}> & {};
  toolCommands: GetResult<CommandModel[], {}> & {};
  toolContexts: GetResult<ToolContextModel[], {}> & {};
  toolSteps: GetResult<ToolStepModel[], {}> & {};
};
