/**
 * Command Interface - Defines actions that tools can execute
 */

/**
 * CommandModel - Database model interface
 */
export interface CommandModel {
  id: string;
  toolId: string;
  name: string;
  action: string;
  repository?: string | null;
  script?: string | null;
  params?: string | null;
  description?: string | null;
  enabled: boolean;
  timeout?: number | null;
  retries?: number | null;
  metadata?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * CommandDto - Data Transfer Object for creating/updating commands
 */
export interface CommandDto {
  toolId: string;
  name: string;
  action: string;
  repository?: string | null;
  script?: string | null;
  params?: string | null;
  description?: string | null;
  enabled?: boolean;
  timeout?: number | null;
  retries?: number | null;
  metadata?: string | null;
}

/**
 * CommandDro - Data Response Object for command responses
 */
export interface CommandDro {
  id: string;
  toolId: string;
  name: string;
  action: string;
  repository?: string | null;
  script?: string | null;
  params?: Record<string, any> | null; // Parsed JSON params
  description?: string | null;
  enabled: boolean;
  timeout?: number | null;
  retries?: number | null;
  metadata?: Record<string, any> | null; // Parsed JSON metadata
  createdAt: Date;
  updatedAt: Date;
  tool?: {
    id: string;
    name: string;
    type: string;
  };
  executions?: CommandExecutionDro[];
}

/**
 * CommandExecutionModel - Database model for command execution history
 */
export interface CommandExecutionModel {
  id: string;
  commandId: string;
  status: string;
  input?: string | null;
  output?: string | null;
  error?: string | null;
  executedBy?: string | null;
  duration?: number | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
}

/**
 * CommandExecutionDto - DTO for creating command executions
 */
export interface CommandExecutionDto {
  commandId: string;
  status?: string;
  input?: string | null;
  output?: string | null;
  error?: string | null;
  executedBy?: string | null;
  duration?: number | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
}

/**
 * CommandExecutionDro - Response object for command executions
 */
export interface CommandExecutionDro {
  id: string;
  commandId: string;
  status: string;
  input?: Record<string, any> | null; // Parsed JSON input
  output?: Record<string, any> | null; // Parsed JSON output
  error?: string | null;
  executedBy?: string | null;
  duration?: number | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  command?: {
    id: string;
    name: string;
    action: string;
  };
}

/**
 * Command execution request
 */
export interface ExecuteCommandRequest {
  commandId: string;
  input?: Record<string, any>;
  executedBy?: string;
}

/**
 * Command execution result
 */
export interface ExecuteCommandResult {
  executionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: Record<string, any>;
  error?: string;
  duration?: number;
}
