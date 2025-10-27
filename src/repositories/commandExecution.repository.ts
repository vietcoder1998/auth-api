import { BaseRepository } from './base.repository';
import { CommandExecutionModel, CommandExecutionDto, CommandExecutionDro } from '../interfaces';
import { prisma } from '../setup';

/**
 * CommandExecutionRepository - Data access layer for CommandExecution operations
 * 
 * Manages the execution history and tracking of command runs.
 * 
 * @extends BaseRepository<CommandExecutionModel, CommandExecutionDto, CommandExecutionDro>
 */
export class CommandExecutionRepository extends BaseRepository<
  typeof prisma.commandExecution,
  CommandExecutionDto,
  CommandExecutionDro
> {
  constructor() {
    super(prisma.commandExecution);
  }

  /**
   * Find all executions for a specific command
   * @param commandId - The ID of the command
   * @returns Array of executions for the command
   */
  async findByCommandId(commandId: string): Promise<CommandExecutionDro[]> {
    const executions = await prisma.commandExecution.findMany({
      where: { commandId },
      orderBy: { createdAt: 'desc' },
      include: {
        command: {
          select: {
            id: true,
            name: true,
            action: true,
          },
        },
      },
    });
    return executions as CommandExecutionDro[];
  }

  /**
   * Find executions by status
   * @param status - The execution status
   * @returns Array of executions with the specified status
   */
  async findByStatus(status: string): Promise<CommandExecutionDro[]> {
    return this.findMany<CommandExecutionDro>({
      status,
    });
  }

  /**
   * Find pending executions
   * @returns Array of pending executions
   */
  async findPending(): Promise<CommandExecutionDro[]> {
    return this.findByStatus('pending');
  }

  /**
   * Find running executions
   * @returns Array of running executions
   */
  async findRunning(): Promise<CommandExecutionDro[]> {
    return this.findByStatus('running');
  }

  /**
   * Find failed executions
   * @returns Array of failed executions
   */
  async findFailed(): Promise<CommandExecutionDro[]> {
    return this.findByStatus('failed');
  }

  /**
   * Find completed executions
   * @returns Array of completed executions
   */
  async findCompleted(): Promise<CommandExecutionDro[]> {
    return this.findByStatus('completed');
  }

  /**
   * Find executions by executor
   * @param executedBy - The ID of the user or agent who executed
   * @returns Array of executions
   */
  async findByExecutor(executedBy: string): Promise<CommandExecutionDro[]> {
    return this.findMany<CommandExecutionDro>({
      executedBy,
    });
  }

  /**
   * Get recent executions (limit to last N)
   * @param limit - Number of recent executions to retrieve
   * @returns Array of recent executions
   */
  async findRecent(limit: number = 50): Promise<CommandExecutionDro[]> {
    const executions = await prisma.commandExecution.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        command: {
          select: {
            id: true,
            name: true,
            action: true,
          },
        },
      },
    });
    return executions as CommandExecutionDro[];
  }

  /**
   * Count executions for a command
   * @param commandId - The ID of the command
   * @param status - Optional status filter
   * @returns Count of executions
   */
  async countByCommandId(commandId: string, status?: string): Promise<number> {
    const where: Record<string, any> = { commandId };
    if (status) {
      where.status = status;
    }
    return this.count(where);
  }

  /**
   * Get average execution duration for a command
   * @param commandId - The ID of the command
   * @returns Average duration in milliseconds, or null if no completed executions
   */
  async getAverageDuration(commandId: string): Promise<number | null> {
    const result = await prisma.commandExecution.aggregate({
      where: {
        commandId,
        status: 'completed',
        duration: { not: null },
      },
      _avg: {
        duration: true,
      },
    });
    return result._avg.duration;
  }

  /**
   * Delete old executions (cleanup)
   * @param olderThanDays - Delete executions older than this many days
   * @returns Delete result with count
   */
  async deleteOldExecutions(olderThanDays: number): Promise<{ count: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.commandExecution.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return { count: result.count };
  }
}
