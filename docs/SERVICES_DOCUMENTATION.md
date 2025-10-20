P# Auth API Services Documentation

This document provides an overview of all the services created for the Auth API system.

## Service Architecture

All services follow a consistent pattern:

- Use Prisma for database operations
- Export typed interfaces for data operations
- Include error handling and validation
- Support pagination where applicable
- Return standardized response formats

## Core Services

### 1. User Service (`user.service.ts`)

**Purpose**: User management and authentication operations

**Key Features**:

- User CRUD operations with password hashing
- User search and pagination
- Password verification and change
- User's agents and conversations retrieval
- Role-based user management

**Key Methods**:

- `createUser(data)` - Create new user with hashed password
- `getUserById(id)` - Get user with role and permissions
- `updateUser(id, data)` - Update user information
- `getUserAgents(userId)` - Get user's AI agents
- `changePassword(id, oldPass, newPass)` - Secure password change

### 2. Role Service (`role.service.ts`)

**Purpose**: Role-based access control management

**Key Features**:

- Role CRUD operations
- Permission assignment to roles
- User-role relationship management
- Role usage validation

**Key Methods**:

- `createRole(data)` - Create role with permissions
- `addPermissionToRole(roleId, permissionId)` - Assign permissions
- `getRoleUsers(roleId)` - Get users with specific role

### 3. Permission Service (`permission.service.ts`)

**Purpose**: Fine-grained permission management

**Key Features**:

- Permission CRUD operations
- Category-based organization
- User permission checking
- Permission validation for routes

**Key Methods**:

- `createPermission(data)` - Create new permission
- `userHasPermission(userId, permissionName)` - Check user access
- `getPermissionsByCategory()` - Organized permission listing

### 4. Config Service (`config.service.ts`)

**Purpose**: Application configuration management

**Key Features**:

- Key-value configuration storage
- JSON configuration support
- System and app settings management
- Bulk operations and import/export

**Key Methods**:

- `setConfig(key, value)` - Set configuration value
- `getConfigJSON(key, default)` - Get parsed JSON config
- `getSystemSettings()` - Get all system configurations
- `importConfigs(configs)` - Bulk configuration import

## Authentication & Security Services

### 5. Token Service (`token.service.ts`)

**Purpose**: JWT token management and validation

**Key Features**:

- JWT token generation and verification
- Database token tracking
- Token refresh mechanism
- Expired token cleanup

**Key Methods**:

- `generateTokens(payload)` - Create access/refresh tokens
- `validateTokenAndGetUser(token)` - Validate and get user
- `refreshAccessToken(refreshToken)` - Token refresh
- `cleanupExpiredTokens()` - Maintenance operations

### 6. API Key Service (`apiKey.service.ts`)

**Purpose**: API key management for external access

**Key Features**:

- Secure API key generation
- Permission-based access control
- IP restriction support
- Usage tracking and rate limiting

**Key Methods**:

- `createApiKey(data)` - Generate new API key
- `validateApiKey(key, endpoint, method, ip)` - Comprehensive validation
- `logApiUsage(data)` - Track API usage
- `getApiKeyStats(apiKeyId)` - Usage analytics

### 7. SSO Service (`sso.service.ts`)

**Purpose**: Single Sign-On session management

**Key Features**:

- SSO session creation and validation
- Login/logout tracking
- Session expiry management
- Device and IP tracking

**Key Methods**:

- `createSSO(data)` - Create SSO session
- `validateSSO(key)` - Validate SSO session
- `recordLogin(ssoId, deviceIP, userAgent)` - Track login
- `cleanupExpiredSSOs()` - Session maintenance

## Communication Services

### 8. Mail Service (`mail.service.ts`)

**Purpose**: Email communication and template management

**Key Features**:

- Email template management
- Variable replacement in templates
- Sending status tracking
- Retry mechanism for failed emails

**Key Methods**:

- `createTemplate(data)` - Create email template
- `sendMail(data)` - Send email with tracking
- `sendMailWithTemplate(templateName, to, variables)` - Template-based sending
- `retryMail(id)` - Retry failed emails

## AI & Conversation Services

### 9. LLM Service (`llm.service.ts`)

**Purpose**: AI language model integration

**Key Features**:

- OpenAI API integration
- Connection status monitoring
- Mock response fallback
- Conversation summarization

**Key Methods**:

- `generateResponse(messages, config)` - Generate AI responses
- `isConnected()` - Check API connection status
- `summarizeConversation(conversationId)` - Create conversation summaries

### 10. Agent Service (`agent.service.ts`)

**Purpose**: AI agent management and configuration

**Key Features**:

- AI agent CRUD operations
- Memory management (short/long term)
- Tool integration
- Task assignment and tracking

**Key Methods**:

- `createAgent(data)` - Create AI agent with configuration
- `addMemory(agentId, content, type, importance)` - Add agent memory
- `getAgentTools(agentId)` - Get agent's available tools
- `createTask(agentId, name, input)` - Create agent task

### 11. Conversation Service (`conversation.service.ts`)

**Purpose**: Conversation and message management

**Key Features**:

- Conversation CRUD operations
- Message tracking with position
- Search functionality
- Statistics and analytics

**Key Methods**:

- `createConversation(data)` - Start new conversation
- `addMessage(data)` - Add message to conversation
- `searchMessages(conversationId, query)` - Search message content
- `getConversationStats(conversationId)` - Get conversation analytics

### 12. Command Service (`command.service.ts`)

**Purpose**: Special command processing in conversations

**Key Features**:

- Command parsing from messages
- Cache/memory management commands
- Agent configuration commands
- Task and tool management

**Key Methods**:

- `processCommand(context)` - Execute parsed commands
- `parseCommand(content)` - Parse command from text
- `handleCacheCommand(context)` - Memory/cache operations
- `handleAgentCommand(context)` - Agent configuration

## Tracking & History Services

### 13. History Service (`history.service.ts`)

**Purpose**: User activity and system audit logging

**Key Features**:

- Login/logout tracking
- System action logging
- Notification integration
- Session management

### 14. Entity Label Service (`entityLabel.service.ts`)

**Purpose**: Generic labeling system for all entities

**Key Features**:

- Generic entity-label relationships
- Label assignment and removal
- Cross-entity label search
- Flexible labeling system

## Service Integration

All services are exported through a central index file (`services/index.ts`) providing:

- Centralized service imports
- Type definitions export
- Consistent service interfaces

## Usage Examples

### Basic Service Usage

```typescript
import { userService, agentService, commandService } from '../services';

// Create user
const user = await userService.createUser({
  email: 'user@example.com',
  password: 'securePassword',
  nickname: 'Developer',
});

// Create agent for user
const agent = await agentService.createAgent({
  userId: user.id,
  name: 'Code Assistant',
  model: 'gpt-4',
  systemPrompt: 'You are a helpful coding assistant',
});

// Execute command
const result = await commandService.processCommand({
  conversationId: 'conv-123',
  userId: user.id,
  agentId: agent.id,
  type: 'cache',
  parameters: { action: 'remove_all' },
});
```

### Command System Usage

```typescript
// Parse command from message
const command = commandService.parseCommand('/cache type=cache action=remove_all');

if (command.isCommand) {
  const result = await commandService.processCommand({
    conversationId,
    userId,
    agentId,
    type: command.type,
    parameters: command.parameters,
  });
}
```

## Database Schema Compliance

All services are fully compliant with the Prisma schema defined in `schema.prisma`, including:

- All model relationships
- Required and optional fields
- Proper data types and constraints
- Foreign key relationships
- Index optimizations

## Error Handling

All services implement consistent error handling:

- Descriptive error messages
- Type-safe error responses
- Validation error handling
- Database constraint error handling

## Performance Considerations

- Pagination support for large datasets
- Efficient database queries with proper includes
- Connection pooling through Prisma
- Caching strategies where applicable
- Cleanup operations for expired data
