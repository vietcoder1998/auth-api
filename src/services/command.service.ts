import { PrismaClient } from '@prisma/client';
import { llmService } from './llm.service';
import { BaseService } from './base.service';
import { CommandDro, CommandDto, CommandModel } from '../interfaces';
import * as repositoryInstances from '../repositories';

const prisma = new PrismaClient();

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
  // Extended command properties
  description?: string;
  name?: string;
  params?: string;
  exampleParams?: string;
  toolId?: string;
  entityMethodIds?: string[];
}

export class CommandService extends BaseService<CommandModel, CommandDto, CommandDro> {
  constructor() {
    super(repositoryInstances.commandRepository);
  }

  get commandRepository() {
    return this.repository as repositoryInstances.CommandRepository;
  }
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
        case 'query':
        case 'execute':
        case 'create':
        case 'update':
        case 'delete':
        case 'transform':
          return await this.executeEntityMethod(context);
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
        await repositoryInstances.agentMemoryRepository.deleteByAgentId(context.agentId);
        return {
          success: true,
          message: 'All agent cache/memories cleared successfully',
          type: 'cache',
        };

      case 'remove_short_term':
        await repositoryInstances.agentMemoryRepository.deleteByType(context.agentId, 'short_term');
        return {
          success: true,
          message: 'Short-term cache cleared successfully',
          type: 'cache',
        };

      case 'remove_long_term':
        await repositoryInstances.agentMemoryRepository.deleteByType(context.agentId, 'long_term');
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
        const memory = await repositoryInstances.agentMemoryRepository.create({
          agentId: context.agentId,
          type: parameters.type || 'long_term',
          content: parameters.content,
          importance: parameters.importance || 5,
          metadata: parameters.metadata ? JSON.stringify(parameters.metadata) : null,
        });
        return {
          success: true,
          message: 'Memory added successfully',
          data: memory,
          type: 'memory',
        };

      case 'search':
        const memories = await repositoryInstances.agentMemoryRepository.searchByContent(
          context.agentId,
          parameters.query,
          parameters.limit || 10
        );
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
        const task = await repositoryInstances.agentTaskRepository.create({
          agentId: context.agentId,
          name: parameters.name,
          input: parameters.input ? JSON.stringify(parameters.input) : null,
          status: 'pending',
        });
        return {
          success: true,
          message: 'Task created successfully',
          data: task,
          type: 'task',
        };

      case 'list':
        const tasks = await repositoryInstances.agentTaskRepository.findByAgentId(context.agentId);
        // Limit results
        const limitedTasks = tasks.slice(0, parameters.limit || 20);
        return {
          success: true,
          message: `Found ${limitedTasks.length} tasks`,
          data: limitedTasks,
          type: 'task',
        };

      case 'cancel':
        await repositoryInstances.agentTaskRepository.cancelPendingTasks(context.agentId);
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
        await repositoryInstances.toolRepository.enableTool(context.agentId, parameters.name);
        return {
          success: true,
          message: `Tool "${parameters.name}" enabled successfully`,
          type: 'tool',
        };

      case 'disable':
        await repositoryInstances.toolRepository.disableTool(context.agentId, parameters.name);
        return {
          success: true,
          message: `Tool "${parameters.name}" disabled successfully`,
          type: 'tool',
        };

      case 'list':
        const tools = await repositoryInstances.toolRepository.listAgentTools(context.agentId);
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
  public parseCommand(content: string): {
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

  override async findOne(id: string): Promise<CommandDro | null> {
    const command: CommandDro | null = await this.commandRepository.findOne(id);
    if (!command) {
      return null;
    }

    return command as CommandDro;
  }

  /**
   * Execute repository method dynamically based on entity method name
   */
  private async executeRepositoryMethod(entityMethodName: string, parsedParams: any, parsedExampleParams: any): Promise<any> {
    // Extract entity and method from the entity method name
    // Example: "permission_search" -> entity: "permission", method: "search"
    const [entityName, methodName] = entityMethodName.split('_');
    
    // Get repository instance
    const repositoryKey = `${entityName}Repository` as keyof typeof repositoryInstances;
    const repository = repositoryInstances[repositoryKey];
    
    if (!repository) {
      throw new Error(`No repository found for entity: ${entityName}`);
    }

    // Switch case for different method patterns
    switch (methodName) {
      case 'search':
        return await this.executeSearchMethod(entityName, repository, parsedParams, parsedExampleParams);
      
      case 'findByCategory':
        return await this.executeFindByCategoryMethod(repository, parsedParams, parsedExampleParams);
      
      case 'findByName':
        return await this.executeFindByNameMethod(repository, parsedParams, parsedExampleParams);
      
      case 'findByEmail':
        return await this.executeFindByEmailMethod(repository, parsedParams, parsedExampleParams);
      
      case 'findByMethod':
        return await this.executeFindByMethodMethod(repository, parsedParams, parsedExampleParams);
      
      case 'findByRoute':
        return await this.executeFindByRouteMethod(repository, parsedParams, parsedExampleParams);
      
      case 'findByUser':
        return await this.executeFindByUserMethod(repository, parsedParams, parsedExampleParams);
      
      case 'findByRole':
        return await this.executeFindByRoleMethod(repository, parsedParams, parsedExampleParams);
      
      default:
        // Default to search if specific method not found
        if (repository && typeof (repository as any).search === 'function') {
          return await (repository as any).search({});
        } else {
          throw new Error(`Method '${methodName}' not supported for entity '${entityName}'`);
        }
    }
  }

  /**
   * Execute search method for different entities
   */
  private async executeSearchMethod(entityName: string, repository: any, parsedParams: any, parsedExampleParams: any): Promise<any> {
    switch (entityName) {
      case 'permission':
        const category = parsedExampleParams.category || parsedParams.category;
        if (category) {
          return await repository.findByCategory(category);
        }
        return await repository.findMany({});
      
      case 'user':
        const email = parsedExampleParams.email || parsedParams.email;
        if (email) {
          return await repository.findByEmail(email);
        }
        return await repository.findMany({});
      
      case 'role':
        const name = parsedExampleParams.name || parsedParams.name;
        if (name) {
          return await repository.findByName(name);
        }
        return await repository.findMany({});
      
      default:
        return await repository.findMany({});
    }
  }

  /**
   * Execute findByCategory method
   */
  private async executeFindByCategoryMethod(repository: any, parsedParams: any, parsedExampleParams: any): Promise<any> {
    const category = parsedExampleParams.category || parsedParams.category;
    if (!category) {
      throw new Error('Category parameter is required for findByCategory method');
    }
    return await repository.findByCategory(category);
  }

  /**
   * Execute findByName method
   */
  private async executeFindByNameMethod(repository: any, parsedParams: any, parsedExampleParams: any): Promise<any> {
    const name = parsedExampleParams.name || parsedParams.name;
    if (!name) {
      throw new Error('Name parameter is required for findByName method');
    }
    return await repository.findByName(name);
  }

  /**
   * Execute findByEmail method
   */
  private async executeFindByEmailMethod(repository: any, parsedParams: any, parsedExampleParams: any): Promise<any> {
    const email = parsedExampleParams.email || parsedParams.email;
    if (!email) {
      throw new Error('Email parameter is required for findByEmail method');
    }
    return await repository.findByEmail(email);
  }

  /**
   * Execute findByMethod method
   */
  private async executeFindByMethodMethod(repository: any, parsedParams: any, parsedExampleParams: any): Promise<any> {
    const method = parsedExampleParams.method || parsedParams.method;
    if (!method) {
      throw new Error('Method parameter is required for findByMethod method');
    }
    return await repository.findByMethod(method);
  }

  /**
   * Execute findByRoute method
   */
  private async executeFindByRouteMethod(repository: any, parsedParams: any, parsedExampleParams: any): Promise<any> {
    const route = parsedExampleParams.route || parsedParams.route;
    if (!route) {
      throw new Error('Route parameter is required for findByRoute method');
    }
    return await repository.findByRoute(route);
  }

  /**
   * Execute findByUser method
   */
  private async executeFindByUserMethod(repository: any, parsedParams: any, parsedExampleParams: any): Promise<any> {
    const userId = parsedExampleParams.userId || parsedParams.userId;
    if (!userId) {
      throw new Error('UserId parameter is required for findByUser method');
    }
    return await repository.findByUser(userId);
  }

  /**
   * Execute findByRole method
   */
  private async executeFindByRoleMethod(repository: any, parsedParams: any, parsedExampleParams: any): Promise<any> {
    const roleId = parsedExampleParams.roleId || parsedParams.roleId;
    if (!roleId) {
      throw new Error('RoleId parameter is required for findByRole method');
    }
    return await repository.findByRole(roleId);
  }

  /**
   * Execute entity method with example functionality
   */
  async executeEntityMethod(context: CommandContext): Promise<CommandResult> {
    try {
      const { entityMethodIds, params, exampleParams } = context;
      
      if (!entityMethodIds || entityMethodIds.length === 0) {
        return {
          success: false,
          message: 'No entity method IDs provided',
          type: 'error',
        };
      }

      const results = [];
      
      for (const entityMethodId of entityMethodIds) {
        // Fetch entity method details
        const entityMethod = await repositoryInstances.entityMethodRepository.findById(entityMethodId);
        
        if (!entityMethod) {
          results.push({
            entityMethodId,
            success: false,
            error: `Entity method with ID ${entityMethodId} not found`,
          });
          continue;
        }

        // Parse parameters
        let parsedParams: any = {};
        let parsedExampleParams: any = {};
        
        try {
          if (params) {
            parsedParams = typeof params === 'string' ? JSON.parse(params) : params;
          }
          if (exampleParams) {
            parsedExampleParams = typeof exampleParams === 'string' ? JSON.parse(exampleParams) : exampleParams;
          }
        } catch (parseError) {
          results.push({
            entityMethodId,
            success: false,
            error: `Failed to parse parameters: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
          });
          continue;
        }

        // Get entity method name and execute
        const entityMethodName = `${(entityMethod as any).name?.toLowerCase()}`;
        
        // Execute the method based on the entity method name
        try {
          let result;
          
          // Use the new dynamic execution approach
          result = await this.executeRepositoryMethod(entityMethodName, parsedParams, parsedExampleParams);

          results.push({
            entityMethodId,
            entityMethodName,
            success: true,
            data: result,
            parameters: parsedParams,
            exampleParameters: parsedExampleParams,
          });
          
        } catch (executionError) {
          results.push({
            entityMethodId,
            entityMethodName,
            success: false,
            error: `Execution failed: ${executionError instanceof Error ? executionError.message : 'Unknown error'}`,
          });
        }
      }

      return {
        success: true,
        message: `Executed ${results.length} entity method(s)`,
        data: results,
        type: 'entity_method_execution',
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Entity method execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      };
    }
  }
}

export const commandService = new CommandService();