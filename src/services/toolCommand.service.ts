import {
  CommandDro,
  CommandDto,
  CommandExecutionModel,
  CommandModel,
  ExecuteCommandRequest,
  ExecuteCommandResult,
} from '../interfaces';
import { CommandRepository } from '../repositories/command.repository';
import { CommandExecutionRepository } from '../repositories/commandExecution.repository';
import { BaseService } from './base.service';

/**
 * ToolCommandService - Business logic layer for Tool Command operations
 *
 * Provides command management operations for tools, including executing commands,
 * tracking execution history, and managing command configurations.
 *
 * @extends BaseService<CommandModel, CommandDto, CommandDro>
 *
 * @example
 * ```typescript
 * const toolCommandService = new ToolCommandService();
 *
 * // Execute a command
 * const result = await toolCommandService.executeCommand({
 *   commandId: 'cmd-123',
 *   input: { param1: 'value1' },
 *   executedBy: 'user-123'
 * });
 *
 * // List commands for a tool
 * const commands = await toolCommandService.findByToolId('tool-123');
 * ```
 */
export class ToolCommandService extends BaseService<CommandModel, CommandDto, CommandDro> {
  private commandRepository: CommandRepository;
  private executionRepository: CommandExecutionRepository;

  constructor() {
    const commandRepository = new CommandRepository();
    super(commandRepository);
    this.commandRepository = commandRepository;
    this.executionRepository = new CommandExecutionRepository();
  }

  /**
   * Find all commands for a specific tool
   * @param toolId - The ID of the tool
   * @returns Array of commands for the tool
   */
  async findByToolId(toolId: string): Promise<CommandDro[]> {
    return this.commandRepository.findByToolId(toolId);
  }

  /**
   * Find enabled commands for a tool
   * @param toolId - The ID of the tool
   * @returns Array of enabled commands
   */
  async findEnabledCommands(toolId: string): Promise<CommandDro[]> {
    return this.commandRepository.findEnabledCommands(toolId);
  }

  /**
   * Find command by tool ID and name
   * @param toolId - The ID of the tool
   * @param name - The name of the command
   * @returns The command or null if not found
   */
  async findByToolAndName(toolId: string, name: string): Promise<CommandDro | null> {
    return this.commandRepository.findByToolAndName(toolId, name);
  }

  /**
   * Find commands by action type
   * @param action - The action type
   * @returns Array of commands with the specified action
   */
  async findByAction(action: string): Promise<CommandDro[]> {
    return this.commandRepository.findByAction(action);
  }

  /**
   * Find commands by repository
   * @param repository - The repository identifier
   * @returns Array of commands for the repository
   */
  async findByRepository(repository: string): Promise<CommandDro[]> {
    return this.commandRepository.findByRepository(repository);
  }

  /**
   * Enable a command
   * @param id - The command ID
   * @returns The updated command
   */
  async enable(id: string): Promise<CommandDro | null> {
    return this.commandRepository.enable(id);
  }

  /**
   * Disable a command
   * @param id - The command ID
   * @returns The updated command
   */
  async disable(id: string): Promise<CommandDro | null> {
    return this.commandRepository.disable(id);
  }

  /**
   * Enable all commands for a tool
   * @param toolId - The ID of the tool
   * @returns Update result with count
   */
  async enableAllForTool(toolId: string): Promise<{ count: number }> {
    return this.commandRepository.enableAllForTool(toolId);
  }

  /**
   * Disable all commands for a tool
   * @param toolId - The ID of the tool
   * @returns Update result with count
   */
  async disableAllForTool(toolId: string): Promise<{ count: number }> {
    return this.commandRepository.disableAllForTool(toolId);
  }

  /**
   * Delete all commands for a tool
   * @param toolId - The ID of the tool
   * @returns Delete result with count
   */
  async deleteByToolId(toolId: string): Promise<{ count: number }> {
    return this.commandRepository.deleteByToolId(toolId);
  }

  /**
   * Count commands for a tool
   * @param toolId - The ID of the tool
   * @param enabledOnly - If true, count only enabled commands
   * @returns Count of commands
   */
  async countByToolId(toolId: string, enabledOnly: boolean = false): Promise<number> {
    return this.commandRepository.countByToolId(toolId, enabledOnly);
  }

  /**
   * Check if a command exists for a tool
   * @param toolId - The ID of the tool
   * @param name - The name of the command
   * @returns True if the command exists
   */
  async existsByToolAndName(toolId: string, name: string): Promise<boolean> {
    return this.commandRepository.existsByToolAndName(toolId, name);
  }

  /**
   * Execute a command
   * @param request - The execution request
   * @returns Execution result
   */
  async executeCommand(request: ExecuteCommandRequest): Promise<ExecuteCommandResult> {
    const commands = await this.commandRepository.findMany<CommandDro>({
      id: request.commandId,
    });
    const command = commands.length > 0 ? commands[0] : null;

    if (!command) {
      throw new Error('Command not found');
    }

    if (!command.enabled) {
      throw new Error('Command is disabled');
    }

    // Create execution record
    const execution = (await this.executionRepository.create({
      commandId: request.commandId,
      status: 'pending',
      input: request.input ? JSON.stringify(request.input) : null,
      executedBy: request.executedBy,
      startedAt: new Date(),
    })) as CommandExecutionModel;

    try {
      // Update to running
      await this.executionRepository.update(execution.id, {
        status: 'running',
      });

      // Execute the command (this is a placeholder - actual execution logic would go here)
      const startTime = Date.now();
      const output = await this.performCommandExecution(command, request.input);
      const duration = Date.now() - startTime;

      // Update to completed
      await this.executionRepository.update(execution.id, {
        status: 'completed',
        output: JSON.stringify(output),
        duration,
        completedAt: new Date(),
      });

      return {
        executionId: execution.id,
        status: 'completed',
        output,
        duration,
      };
    } catch (error) {
      // Update to failed
      await this.executionRepository.update(execution.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        completedAt: new Date(),
      });

      return {
        executionId: execution.id,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Perform the actual command execution
   * This is a placeholder - implement actual execution logic based on command type
   */
  private async performCommandExecution(
    command: CommandDro,
    input?: Record<string, any>,
  ): Promise<Record<string, any>> {
    // Parse command metadata and extract parameters
    let commandConfig: Record<string, any> = {};
    let entityConfig: Record<string, any> = {};
    let permissionConfig: Record<string, any> = {};
    
    if (command.metadata) {
      if (typeof command.metadata === 'string') {
        const metadata = JSON.parse(command.metadata);
        commandConfig = metadata;
        permissionConfig = metadata.permission || {};
        entityConfig = metadata.entity || {};
      } else {
        commandConfig = command.metadata;
        permissionConfig = command.metadata.permission || {};
        entityConfig = command.metadata.entity || {};
      }
    }
    
    // Fallback to legacy params for backward compatibility
    let legacyParams: Record<string, any> = {};
    if (command.params) {
      if (typeof command.params === 'string') {
        legacyParams = JSON.parse(command.params);
      } else {
        legacyParams = command.params;
      }
    }

    // TODO: Implement actual command execution based on command.action
    // This would integrate with your repository/system/API based on command configuration

    // For now, return a mock result
    return {
      success: true,
      message: `Command ${command.name} executed successfully`,
      action: command.action,
      repository: command.repository,
      input,
      metadata: commandConfig,
      permission: permissionConfig,
      entity: entityConfig,
      legacyParams, // Include for backward compatibility
    };
  }

  /**
   * Get execution history for a command
   * @param commandId - The ID of the command
   * @returns Array of executions
   */
  async getExecutionHistory(commandId: string) {
    return this.executionRepository.findByCommandId(commandId);
  }

  /**
   * Get recent executions
   * @param limit - Number of executions to retrieve
   * @returns Array of recent executions
   */
  async getRecentExecutions(limit: number = 50) {
    return this.executionRepository.findRecent(limit);
  }

  /**
   * Get average execution duration for a command
   * @param commandId - The ID of the command
   * @returns Average duration in milliseconds
   */
  async getAverageDuration(commandId: string): Promise<number | null> {
    return this.executionRepository.getAverageDuration(commandId);
  }

  /**
   * Cleanup old executions
   * @param olderThanDays - Delete executions older than this many days
   * @returns Delete result with count
   */
  async cleanupOldExecutions(olderThanDays: number = 30): Promise<{ count: number }> {
    return this.executionRepository.deleteOldExecutions(olderThanDays);
  }
}

export const toolCommandService = new ToolCommandService();
