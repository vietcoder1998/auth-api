# Command Service Usage Examples

The Command Service provides a powerful way to handle special commands in conversations. Here are examples of how to use it:

## API Endpoint

```
POST /api/conversations/:conversationId/command
```

## Command Types

### 1. Cache Commands

Remove all agent memories/cache:
```json
{
  "type": "cache",
  "parameters": {
    "action": "remove_all"
  }
}
```

Remove only short-term memory:
```json
{
  "type": "cache", 
  "parameters": {
    "action": "remove_short_term"
  }
}
```

### 2. Memory Commands

Add a memory:
```json
{
  "type": "memory",
  "parameters": {
    "action": "add",
    "content": "User prefers technical explanations",
    "type": "long_term",
    "importance": 8,
    "metadata": {
      "category": "user_preference",
      "tags": ["technical", "preference"]
    }
  }
}
```

Search memories:
```json
{
  "type": "memory",
  "parameters": {
    "action": "search",
    "query": "technical",
    "limit": 5
  }
}
```

### 3. Conversation Commands

Summarize conversation:
```json
{
  "type": "conversation",
  "parameters": {
    "action": "summarize"
  }
}
```

Clear conversation:
```json
{
  "type": "conversation",
  "parameters": {
    "action": "clear"
  }
}
```

### 4. Agent Commands

Reset agent configuration:
```json
{
  "type": "agent",
  "parameters": {
    "action": "reset"
  }
}
```

Update agent config:
```json
{
  "type": "agent",
  "parameters": {
    "action": "update_config",
    "config": {
      "temperature": 0.8,
      "maxTokens": 1500
    }
  }
}
```

### 5. Task Commands

Create a task:
```json
{
  "type": "task",
  "parameters": {
    "action": "create",
    "name": "Analyze user feedback",
    "input": {
      "feedback": "The app is great but could use better navigation"
    }
  }
}
```

List tasks:
```json
{
  "type": "task",
  "parameters": {
    "action": "list",
    "limit": 10
  }
}
```

### 6. Tool Commands

Enable a tool:
```json
{
  "type": "tool",
  "parameters": {
    "action": "enable",
    "name": "web_search"
  }
}
```

## Command Parsing from Messages

The system can also parse commands from message content:

```
/cache type=cache action=remove_all
/memory type=memory action=add content="User likes detailed explanations"
/fix type=conversation action=summarize
/add type=task action=create name="Review code"
```

## Response Format

All commands return a standardized response:

```json
{
  "success": true,
  "message": "Command executed successfully",
  "type": "cache",
  "data": { /* optional result data */ }
}
```

Error response:
```json
{
  "success": false,
  "message": "Invalid command type: unknown",
  "type": "error"
}
```

## Usage in Frontend

```typescript
// Execute a command
const executeCommand = async (conversationId: string, type: string, parameters: any) => {
  const response = await fetch(`/api/conversations/${conversationId}/command`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ type, parameters })
  });
  
  const result = await response.json();
  console.log('Command result:', result);
  return result;
};

// Clear cache example
await executeCommand('conv-123', 'cache', { action: 'remove_all' });

// Add memory example
await executeCommand('conv-123', 'memory', {
  action: 'add',
  content: 'User is a developer',
  type: 'long_term',
  importance: 7
});
```

## Integration with Message Processing

```typescript
// In message processing
const { isCommand, command, type, parameters } = commandService.parseCommand(messageContent);

if (isCommand) {
  const result = await commandService.processCommand({
    conversationId,
    userId,
    agentId,
    type,
    parameters
  });
  
  // Handle command result
  if (result.success) {
    console.log(`Command executed: ${result.message}`);
  } else {
    console.error(`Command failed: ${result.message}`);
  }
}
```