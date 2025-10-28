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
   * Find enabled commands for a tool
   * @param toolId - The ID of the tool
   * @returns Array of enabled commands
   */
  async findEnabledCommands(toolId: string): Promise<CommandDro[]> {
    return this.findMany<CommandDro>({
      toolId,
      enabled: true,
    });
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

  override async findOne(id: string): Promise<CommandDro | null> {
    const entity: CommandResult | null = await this.commandModel.findFirst({
      where: { id },
      include: {
        tool: true,
      },
    }) as CommandResult | null;
    // Use convertResultToDro to map to CommandDro
    return entity ? this.convertResultToDro(entity) : null;
  }

  private convertResultToDro(result: CommandResult): CommandDro {
    return result as unknown as CommandDro
  }
}
