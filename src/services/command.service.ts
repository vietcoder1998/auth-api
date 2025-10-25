import { PrismaClient } from '@prisma/client';
import { llmService } from './llm.service';
import { ToolRepository } from '../repositories/tool.repository';

const prisma = new PrismaClient();
const toolRepository = new ToolRepository();

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  type: string;
}

export interface CommandContext {
  conversationId: string;
  userId: string;
  agentId: string;
  type: string;
  parameters?: any;
}

export class CommandService {
  /**
   * Process command from conversation
   */
  async processCommand(context: CommandContext): Promise<CommandResult> {
    try {
      switch (context.type.toLowerCase()) {
        case 'cache':
          return await this.handleCacheCommand(context);
        case 'memory':
          return await this.handleMemoryCommand(context);
        case 'conversation':
          return await this.handleConversationCommand(context);
        case 'agent':
          return await this.handleAgentCommand(context);
        case 'task':
          return await this.handleTaskCommand(context);
        case 'tool':
          return await this.handleToolCommand(context);
        default:
          return {
            success: false,
            message: `Unknown command type: ${context.type}`,
            type: 'error',
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      };
    }
  }

  /**
   * Handle cache-related commands
   */
  private async handleCacheCommand(context: CommandContext): Promise<CommandResult> {
    const { parameters } = context;

    switch (parameters?.action) {
      case 'remove_all':
        // Clear all agent memories
        await prisma.agentMemory.deleteMany({
          where: { agentId: context.agentId },
        });
        return {
          success: true,
          message: 'All agent cache/memories cleared successfully',
          type: 'cache',
        };

      case 'remove_short_term':
        await prisma.agentMemory.deleteMany({
          where: {
            agentId: context.agentId,
            type: 'short_term',
          },
        });
        return {
          success: true,
          message: 'Short-term cache cleared successfully',
          type: 'cache',
        };

      case 'remove_long_term':
        await prisma.agentMemory.deleteMany({
          where: {
            agentId: context.agentId,
            type: 'long_term',
          },
        });
        return {
          success: true,
          message: 'Long-term cache cleared successfully',
          type: 'cache',
        };

      default:
        return {
          success: false,
          message:
            'Invalid cache action. Available: remove_all, remove_short_term, remove_long_term',
          type: 'error',
        };
    }
  }

  /**
   * Handle memory-related commands
   */
  private async handleMemoryCommand(context: CommandContext): Promise<CommandResult> {
    const { parameters } = context;

    switch (parameters?.action) {
      case 'add':
        const memory = await prisma.agentMemory.create({
          data: {
            agentId: context.agentId,
            type: parameters.type || 'long_term',
            content: parameters.content,
            importance: parameters.importance || 5,
            metadata: parameters.metadata ? JSON.stringify(parameters.metadata) : null,
          },
        });
        return {
          success: true,
          message: 'Memory added successfully',
          data: memory,
          type: 'memory',
        };

      case 'search':
        const memories = await prisma.agentMemory.findMany({
          where: {
            agentId: context.agentId,
            content: {
              contains: parameters.query,
            },
          },
          orderBy: { importance: 'desc' },
          take: parameters.limit || 10,
        });
        return {
          success: true,
          message: `Found ${memories.length} memories`,
          data: memories,
          type: 'memory',
        };

      default:
        return {
          success: false,
          message: 'Invalid memory action. Available: add, search',
          type: 'error',
        };
    }
  }

  /**
   * Handle conversation-related commands
   */
  private async handleConversationCommand(context: CommandContext): Promise<CommandResult> {
    const { parameters } = context;

    switch (parameters?.action) {
      case 'summarize':
        const summary = await llmService.summarizeConversation(context.conversationId);
        await prisma.conversation.update({
          where: { id: context.conversationId },
          data: { summary },
        });
        return {
          success: true,
          message: 'Conversation summarized successfully',
          data: { summary },
          type: 'conversation',
        };

      case 'clear':
        await prisma.message.deleteMany({
          where: { conversationId: context.conversationId },
        });
        return {
          success: true,
          message: 'Conversation cleared successfully',
          type: 'conversation',
        };

      case 'export':
        const messages = await prisma.message.findMany({
          where: { conversationId: context.conversationId },
          orderBy: { position: 'asc' },
        });
        return {
          success: true,
          message: 'Conversation exported successfully',
          data: messages,
          type: 'conversation',
        };

      default:
        return {
          success: false,
          message: 'Invalid conversation action. Available: summarize, clear, export',
          type: 'error',
        };
    }
  }

  /**
   * Handle agent-related commands
   */
  private async handleAgentCommand(context: CommandContext): Promise<CommandResult> {
    const { parameters } = context;

    switch (parameters?.action) {
      case 'reset':
        // Reset agent configuration to defaults
        await prisma.agent.update({
          where: { id: context.agentId },
          data: {
            config: JSON.stringify({
              temperature: 0.7,
              maxTokens: 1000,
            }),
            personality: null,
          },
        });
        return {
          success: true,
          message: 'Agent configuration reset to defaults',
          type: 'agent',
        };

      case 'update_config':
        await prisma.agent.update({
          where: { id: context.agentId },
          data: {
            config: JSON.stringify(parameters.config),
          },
        });
        return {
          success: true,
          message: 'Agent configuration updated successfully',
          type: 'agent',
        };

      default:
        return {
          success: false,
          message: 'Invalid agent action. Available: reset, update_config',
          type: 'error',
        };
    }
  }

  /**
   * Handle task-related commands
   */
  private async handleTaskCommand(context: CommandContext): Promise<CommandResult> {
    const { parameters } = context;

    switch (parameters?.action) {
      case 'create':
        const task = await prisma.agentTask.create({
          data: {
            agentId: context.agentId,
            name: parameters.name,
            input: parameters.input ? JSON.stringify(parameters.input) : null,
            status: 'pending',
          },
        });
        return {
          success: true,
          message: 'Task created successfully',
          data: task,
          type: 'task',
        };

      case 'list':
        const tasks = await prisma.agentTask.findMany({
          where: { agentId: context.agentId },
          orderBy: { createdAt: 'desc' },
          take: parameters.limit || 20,
        });
        return {
          success: true,
          message: `Found ${tasks.length} tasks`,
          data: tasks,
          type: 'task',
        };

      case 'cancel':
        await prisma.agentTask.updateMany({
          where: {
            agentId: context.agentId,
            status: { in: ['pending', 'running'] },
          },
          data: { status: 'cancelled' },
        });
        return {
          success: true,
          message: 'All pending/running tasks cancelled',
          type: 'task',
        };

      default:
        return {
          success: false,
          message: 'Invalid task action. Available: create, list, cancel',
          type: 'error',
        };
    }
  }

  /**
   * Handle tool-related commands
   */
  private async handleToolCommand(context: CommandContext): Promise<CommandResult> {
    const { parameters } = context;

    switch (parameters?.action) {
      case 'enable':
        await toolRepository.enableTool(context.agentId, parameters.name);
        return {
          success: true,
          message: `Tool "${parameters.name}" enabled successfully`,
          type: 'tool',
        };

      case 'disable':
        await toolRepository.disableTool(context.agentId, parameters.name);
        return {
          success: true,
          message: `Tool "${parameters.name}" disabled successfully`,
          type: 'tool',
        };

      case 'list':
        const tools = await toolRepository.listAgentTools(context.agentId);
        return {
          success: true,
          message: `Found ${tools.length} tools`,
          data: tools,
          type: 'tool',
        };

      default:
        return {
          success: false,
          message: 'Invalid tool action. Available: enable, disable, list',
          type: 'error',
        };
    }
  }

  /**
   * Parse command from message content
   */
  parseCommand(content: string): {
    isCommand: boolean;
    command?: string;
    type?: string;
    parameters?: any;
  } {
    const commandRegex = /^\/(\w+)(?:\s+(.+))?$/;
    const match = content.match(commandRegex);

    if (!match) {
      return { isCommand: false };
    }

    const [, command, params] = match;

    // Parse parameters
    let parameters: any = {};
    if (params) {
      try {
        // Try to parse as JSON first
        parameters = JSON.parse(params);
      } catch {
        // If not JSON, parse as key=value pairs
        const pairs = params.split(/\s+/);
        for (const pair of pairs) {
          const [key, value] = pair.split('=');
          if (key && value) {
            parameters[key] = value;
          }
        }
      }
    }

    return {
      isCommand: true,
      command,
      type: parameters.type || command,
      parameters,
    };
  }
}

export const commandService = new CommandService();
