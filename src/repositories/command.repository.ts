import { GetResult } from '@prisma/client/runtime';
import { CommandDro, CommandDto, CommandModel, CommandResult, ToolDro, ToolResult } from '../interfaces';
import { prisma } from '../setup';
import { BaseRepository } from './base.repository';

/**
 * CommandRepository - Data access layer for Command operations
 *
 * Provides database operations for managing commands that tools can execute
 * for actions with repositories and other systems.
 *
 * @extends BaseRepository<CommandModel, CommandDto, CommandDro>
 *
 * @example
 * ```typescript
 * const commandRepo = new CommandRepository();
 *
 * // Find all commands for a tool
 * const commands = await commandRepo.findByToolId('tool-123');
 *
 * // Find enabled commands
 * const enabledCommands = await commandRepo.findEnabledCommands('tool-123');
 * ```
 */
export class CommandRepository extends BaseRepository<CommandModel, CommandDto, CommandDro> {
  constructor(commandModel: any = prisma.command) {
    super(commandModel);
  }

  /**
   * Find all commands for a specific tool
   * @param toolId - The ID of the tool
   * @returns Array of commands for the tool
   */
  async findByToolId(toolId: string): Promise<CommandDro[]> {
    const commands = await prisma.command.findMany({
      where: { toolId },
      orderBy: { createdAt: 'desc' },
      include: {
        tool: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            enabled: true,
          },
        },
        entityMethods: {
          include: {
            entityMethod: {
              include: {
                entity: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return commands.map(command => ({
      ...command,
      // Add any necessary transformation here if CommandDro differs from the Prisma result
    })) as unknown as CommandDro[];
  }

  get commandModel(): CommandModel {
    return this.model as CommandModel;
  }
  /**
   * Find enabled commands for a tool with full relationships
   * @param toolId - The ID of the tool
   * @returns Array of enabled commands with tool and entity methods
   */
  async findEnabledCommands(toolId: string): Promise<CommandDro[]> {
    const commands = await prisma.command.findMany({
      where: { 
        toolId,
        enabled: true 
      },
      orderBy: { createdAt: 'desc' },
      include: {
        tool: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            enabled: true,
          },
        },
        entityMethods: {
          include: {
            entityMethod: {
              include: {
                entity: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return commands as unknown as CommandDro[];
  }

  /**
   * Find command by tool ID and name
   * @param toolId - The ID of the tool
   * @param name - The name of the command
   * @returns The command or null if not found
   */
  async findByToolAndName(toolId: string, name: string): Promise<CommandDro | null> {
    const commands = await this.findMany<CommandDro>({
      toolId,
      name,
    });
    return commands.length > 0 ? commands[0] : null;
  }

  /**
   * Find commands by action type
   * @param action - The action type (e.g., 'execute', 'query', 'update')
   * @returns Array of commands with the specified action
   */
  async findByAction(action: string): Promise<CommandDro[]> {
    return this.findMany<CommandDro>({ action });
  }

  /**
   * Find commands by repository
   * @param repository - The repository identifier
   * @returns Array of commands for the repository
   */
  async findByRepository(repository: string): Promise<CommandDro[]> {
    const commands = await prisma.command.findMany({
      where: {
        repository: { contains: repository },
      },
      orderBy: { createdAt: 'desc' },
    });
    return commands as unknown as CommandDro[];
  }

  /**
   * Enable a command
   * @param id - The command ID
   * @returns The updated command
   */
  async enable(id: string): Promise<CommandDro | null> {
    return this.update<CommandDto, CommandDro>(id, { enabled: true } as CommandDto);
  }

  /**
   * Disable a command
   * @param id - The command ID
   * @returns The updated command
   */
  async disable(id: string): Promise<CommandDro | null> {
    return this.update<CommandDto, CommandDro>(id, { enabled: false } as CommandDto);
  }

  /**
   * Enable all commands for a tool
   * @param toolId - The ID of the tool
   * @returns Update result with count of modified records
   */
  async enableAllForTool(toolId: string): Promise<{ count: number }> {
    return this.updateMany<CommandDto, { count: number }>({ toolId }, {
      enabled: true,
    } as Partial<CommandDto>);
  }

  /**
   * Disable all commands for a tool
   * @param toolId - The ID of the tool
   * @returns Update result with count of modified records
   */
  async disableAllForTool(toolId: string): Promise<{ count: number }> {
    return this.updateMany<CommandDto, { count: number }>({ toolId }, {
      enabled: false,
    } as Partial<CommandDto>);
  }

  /**
   * Delete all commands for a tool
   * @param toolId - The ID of the tool
   * @returns Delete result with count of deleted records
   */
  async deleteByToolId(toolId: string): Promise<{ count: number }> {
    return this.deleteMany<{ count: number }>({ toolId });
  }

  /**
   * Count commands for a tool
   * @param toolId - The ID of the tool
   * @param enabledOnly - If true, count only enabled commands
   * @returns Count of commands
   */
  async countByToolId(toolId: string, enabledOnly: boolean = false): Promise<number> {
    const where: Record<string, any> = { toolId };
    if (enabledOnly) {
      where.enabled = true;
    }
    return this.count(where);
  }

  /**
   * Check if a command exists for a tool
   * @param toolId - The ID of the tool
   * @param name - The name of the command
   * @returns True if the command exists
   */
  async existsByToolAndName(toolId: string, name: string): Promise<boolean> {
    return this.exists({ toolId, name });
  }

  /**
   * Find commands that use a specific entity method
   * @param entityMethodId - The ID of the entity method
   * @returns Array of commands that use the entity method
   */
  async findByEntityMethodId(entityMethodId: string): Promise<CommandDro[]> {
    const commands = await prisma.command.findMany({
      where: {
        entityMethods: {
          some: {
            entityMethodId: entityMethodId,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        tool: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            enabled: true,
          },
        },
        entityMethods: {
          include: {
            entityMethod: {
              include: {
                entity: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return commands as unknown as CommandDro[];
  }

  /**
   * Find commands that use entity methods for a specific entity
   * @param entityId - The ID of the entity
   * @returns Array of commands that use methods from the entity
   */
  async findByEntityId(entityId: string): Promise<CommandDro[]> {
    const commands = await prisma.command.findMany({
      where: {
        entityMethods: {
          some: {
            entityMethod: {
              entityId: entityId,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        tool: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            enabled: true,
          },
        },
        entityMethods: {
          include: {
            entityMethod: {
              include: {
                entity: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return commands as unknown as CommandDro[];
  }

  override async findOne(id: string): Promise<CommandDro | null> {
    const entity: CommandResult | null = await this.commandModel.findFirst({
      where: { id },
      include: {
        tool: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            enabled: true,
          },
        },
        entityMethods: {
          include: {
            entityMethod: {
              include: {
                entity: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  },
                },
              },
            },
          },
        },
      },
    }) as CommandResult | null;
    // Use convertResultToDro to map to CommandDro
    return entity ? this.convertResultToDro(entity) : null;
  }

  /**
   * Get command statistics including entity method counts
   * @param id - Command ID
   * @returns Command with statistics
   */
  async getCommandStats(id: string): Promise<any> {
    const command = await prisma.command.findUnique({
      where: { id },
      include: {
        tool: true,
        entityMethods: {
          include: {
            entityMethod: {
              include: {
                entity: true,
              },
            },
          },
        },
        _count: {
          select: {
            entityMethods: true,
            executions: true,
          },
        },
      },
    });
    return command;
  }

  /**
   * Find commands with entity method counts for listing purposes
   * @param toolId - Optional tool ID to filter by
   * @returns Array of commands with entity method counts
   */
  async findCommandsWithStats(toolId?: string): Promise<any[]> {
    const where = toolId ? { toolId } : {};
    
    const commands = await prisma.command.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        tool: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        _count: {
          select: {
            entityMethods: true,
            executions: true,
          },
        },
      },
    });
    return commands;
  }

  private convertResultToDro(result: CommandResult): CommandDro {
    return result as unknown as CommandDro
  }
}

export const commandRepository = new CommandRepository();