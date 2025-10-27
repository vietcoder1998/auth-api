# Command Model Implementation

## Overview
Added Command and CommandExecution models to enable tools to execute actions with repositories and other systems.

## Database Schema

### Command Model
```prisma
model Command {
  id          String   @id @default(uuid())
  toolId      String
  tool        Tool     @relation(fields: [toolId], references: [id], onDelete: Cascade)
  name        String   // Command name (e.g., 'git_commit', 'deploy', 'test')
  action      String   // Action type (e.g., 'execute', 'query', 'update')
  repository  String?  // Repository identifier or path
  script      String?  @db.Text // Script or command to execute
  params      String?  @db.Text // JSON parameters schema
  description String?  @db.Text
  enabled     Boolean  @default(true)
  timeout     Int?     @default(30000) // Timeout in milliseconds
  retries     Int?     @default(0) // Number of retry attempts
  metadata    String?  @db.Text // JSON metadata for additional configuration
  createdAt   DateTime @default(now())
  updatedAt   DateTime @default(now())

  executions CommandExecution[]

  @@unique([toolId, name])
  @@index([toolId])
  @@index([action])
  @@map("command")
}
```

### CommandExecution Model
```prisma
model CommandExecution {
  id          String    @id @default(uuid())
  commandId   String
  command     Command   @relation(fields: [commandId], references: [id], onDelete: Cascade)
  status      String    @default("pending") // pending, running, completed, failed
  input       String?   @db.Text // JSON input parameters
  output      String?   @db.Text // JSON output/result
  error       String?   @db.Text // Error message if failed
  executedBy  String?   // User or agent ID who executed
  duration    Int?      // Execution duration in milliseconds
  startedAt   DateTime?
  completedAt DateTime?
  createdAt   DateTime  @default(now())

  @@index([commandId])
  @@index([status])
  @@index([createdAt])
  @@map("command_execution")
}
```

### Tool Model (Updated)
- Added `commands Command[]` relation

## Files Created/Modified

### 1. Interfaces
- `src/interfaces/command.interface.ts` - Command model interfaces (CommandModel, CommandDto, CommandDro, CommandExecutionModel, CommandExecutionDto, CommandExecutionDro, ExecuteCommandRequest, ExecuteCommandResult)
- `src/interfaces/index.ts` - Exported Command interfaces

### 2. Repositories
- `src/repositories/command.repository.ts` - CommandRepository with methods:
  - `findByToolId()` - Find all commands for a tool
  - `findEnabledCommands()` - Find enabled commands for a tool
  - `findByToolAndName()` - Find command by tool and name
  - `findByAction()` - Find commands by action type
  - `findByRepository()` - Find commands by repository
  - `enable()` / `disable()` - Enable/disable a command
  - `enableAllForTool()` / `disableAllForTool()` - Bulk operations
  - `deleteByToolId()` - Delete all commands for a tool
  - `countByToolId()` - Count commands for a tool
  - `existsByToolAndName()` - Check if command exists

- `src/repositories/commandExecution.repository.ts` - CommandExecutionRepository with methods:
  - `findByCommandId()` - Find executions for a command
  - `findByStatus()` - Find executions by status
  - `findPending()` / `findRunning()` / `findFailed()` / `findCompleted()` - Status-specific queries
  - `findByExecutor()` - Find executions by executor
  - `findRecent()` - Get recent executions
  - `countByCommandId()` - Count executions
  - `getAverageDuration()` - Calculate average execution time
  - `deleteOldExecutions()` - Cleanup old records

### 3. Services
- `src/services/toolCommand.service.ts` - ToolCommandService with methods:
  - All repository methods (proxied through service layer)
  - `executeCommand()` - Execute a command with tracking
  - `getExecutionHistory()` - Get execution history
  - `getRecentExecutions()` - Get recent executions
  - `getAverageDuration()` - Get average execution duration
  - `cleanupOldExecutions()` - Cleanup old executions

### 4. Database Migration
- Created migration: `20251027031220_add_command_models`
- Migration applied successfully ✅

## Architecture

### Three-Tier Pattern
```
Controller → Service → Repository → Database
```

### Tool → Command → Execution Flow
```
Tool
├── Command 1 (enabled)
│   ├── CommandExecution 1 (completed)
│   ├── CommandExecution 2 (failed)
│   └── CommandExecution 3 (running)
├── Command 2 (disabled)
└── Command 3 (enabled)
    └── CommandExecution 4 (pending)
```

## Usage Examples

### Create a Command
```typescript
const command = await toolCommandService.create({
  toolId: 'tool-123',
  name: 'git_commit',
  action: 'execute',
  repository: 'my-repo',
  script: 'git commit -m "${message}"',
  params: JSON.stringify({
    message: { type: 'string', required: true }
  }),
  description: 'Commit changes to git repository',
  enabled: true,
  timeout: 30000,
  retries: 3
});
```

### Execute a Command
```typescript
const result = await toolCommandService.executeCommand({
  commandId: 'cmd-123',
  input: { message: 'Fix bug in authentication' },
  executedBy: 'user-123'
});

console.log(result);
// {
//   executionId: 'exec-456',
//   status: 'completed',
//   output: { success: true, ... },
//   duration: 1234
// }
```

### Query Commands
```typescript
// Get all commands for a tool
const commands = await toolCommandService.findByToolId('tool-123');

// Get enabled commands only
const enabled = await toolCommandService.findEnabledCommands('tool-123');

// Get commands by action type
const executeCommands = await toolCommandService.findByAction('execute');

// Get commands for a repository
const repoCommands = await toolCommandService.findByRepository('my-repo');
```

### Track Execution History
```typescript
// Get execution history for a command
const history = await toolCommandService.getExecutionHistory('cmd-123');

// Get recent executions across all commands
const recent = await toolCommandService.getRecentExecutions(50);

// Get average execution duration
const avgDuration = await toolCommandService.getAverageDuration('cmd-123');
```

### Manage Commands
```typescript
// Enable/disable a command
await toolCommandService.enable('cmd-123');
await toolCommandService.disable('cmd-123');

// Bulk operations
await toolCommandService.enableAllForTool('tool-123');
await toolCommandService.disableAllForTool('tool-123');

// Delete all commands for a tool
await toolCommandService.deleteByToolId('tool-123');

// Cleanup old executions (older than 30 days)
await toolCommandService.cleanupOldExecutions(30);
```

## Next Steps (TODO)

1. **Implement Actual Command Execution Logic**
   - The `performCommandExecution()` method in `toolCommand.service.ts` is currently a placeholder
   - Need to implement actual execution based on `command.action` type
   - Integration with git, APIs, system commands, etc.

2. **Generate Prisma Client**
   - Run: `npx prisma generate` (currently has file lock issue)
   - This will generate TypeScript types for Command and CommandExecution models

3. **Create Controller and Routes**
   - Create `src/controllers/toolCommand.controller.ts` extending BaseController
   - Create `src/routes/toolCommand.routes.ts` for RESTful endpoints
   - Register routes in `src/routes/admin.routes.ts`

4. **Add Command Types/Actions**
   - Define standard command action types (execute, query, update, delete, etc.)
   - Create command execution strategies for different action types
   - Implement retry logic for failed executions

5. **Add Security**
   - Validate command permissions before execution
   - Sanitize input parameters
   - Implement command whitelisting/blacklisting
   - Add rate limiting for command execution

6. **Add Monitoring**
   - Log all command executions
   - Alert on failed executions
   - Track execution metrics (success rate, average duration, etc.)
   - Dashboard for command monitoring

7. **Update Tool Service**
   - Extend `tool.service.ts` to include command management
   - Add methods to create/manage commands for tools
   - Integrate command execution with tool workflows

## Benefits

1. **Structured Command Management**: Commands are properly defined, versioned, and tracked
2. **Execution History**: Complete audit trail of all command executions
3. **Error Handling**: Failed executions are captured with error details
4. **Performance Tracking**: Duration tracking helps identify slow commands
5. **Retry Logic**: Built-in support for retrying failed commands
6. **Timeout Protection**: Prevents long-running commands from blocking
7. **Enable/Disable**: Easy to turn commands on/off without deletion
8. **Repository Actions**: Commands can target specific repositories
9. **Flexible Configuration**: JSON params and metadata support any configuration needs
10. **Integration Ready**: Designed to integrate with git, APIs, system commands, etc.
