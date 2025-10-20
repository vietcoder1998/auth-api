# 🤖 AI Agent API Documentation

## Overview

The AI Agent system provides a comprehensive multi-tenant platform for managing AI agents, conversations, and memories. Each user can create and manage their own AI agents with custom configurations, personalities, and capabilities.

## 🏗️ Architecture

### Database Schema

```
User (1) ──< Agent (n)
Agent (1) ──< AgentMemory (n)
Agent (1) ──< Conversation (n) ──> User (1)
Conversation (1) ──< Message (n)
Agent (1) ──< AgentTool (n)
Agent (1) ──< AgentTask (n)
```

### Key Features

- **Multi-tenant**: Each user has their own agents
- **Configurable**: Custom models, personalities, system prompts
- **Memory system**: Short-term, long-term, and knowledge base memories
- **Tool integration**: Agents can use external APIs and functions
- **LLM integration**: OpenAI-compatible API support
- **Conversation management**: Full chat history and context

---

## 🔗 API Endpoints

### Agent Management

#### `GET /api/admin/agents`

Get all agents for the authenticated user.

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search in agent name/description

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "My Assistant",
      "description": "A helpful AI assistant",
      "model": "gpt-4",
      "isActive": true,
      "_count": {
        "conversations": 5,
        "memories": 12,
        "tools": 3
      },
      "createdAt": "2025-10-15T...",
      "updatedAt": "2025-10-15T..."
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

#### `POST /api/admin/agents`

Create a new AI agent.

**Body:**

```json
{
  "name": "My Assistant",
  "description": "A helpful AI assistant",
  "model": "gpt-4",
  "personality": {
    "traits": ["helpful", "friendly"],
    "tone": "professional"
  },
  "systemPrompt": "You are a helpful AI assistant...",
  "config": {
    "temperature": 0.7,
    "maxTokens": 1000
  }
}
```

#### `GET /api/admin/agents/:id`

Get a specific agent with full configuration.

#### `PUT /api/admin/agents/:id`

Update an agent's configuration.

#### `DELETE /api/admin/agents/:id`

Delete an agent and all associated data.

### Agent Memory Management

#### `POST /api/admin/agents/:id/memories`

Add memory to an agent.

**Body:**

```json
{
  "type": "long_term", // or "short_term", "knowledge_base"
  "content": "User prefers concise explanations",
  "importance": 8, // 1-10 scale
  "metadata": {
    "source": "conversation",
    "date": "2025-10-15",
    "tags": ["preference", "communication"]
  }
}
```

#### `GET /api/admin/agents/:id/memories`

Get agent memories with filtering.

**Query Parameters:**

- `type`: Filter by memory type
- `page`, `limit`: Pagination

### Conversation Management

#### `GET /api/admin/conversations`

Get user's conversations.

**Query Parameters:**

- `agentId`: Filter by specific agent
- `page`, `limit`: Pagination

#### `POST /api/admin/conversations`

Create a new conversation.

**Body:**

```json
{
  "agentId": "uuid",
  "title": "Chat about AI"
}
```

#### `GET /api/admin/conversations/:id`

Get conversation with messages.

#### `POST /api/admin/conversations/:id/messages`

Add message to conversation (triggers AI response for user messages).

**Body:**

```json
{
  "content": "Hello, how are you?",
  "sender": "user" // or "agent", "system"
}
```

**Response for user messages:**

```json
{
  "userMessage": {
    "id": "uuid",
    "content": "Hello, how are you?",
    "sender": "user",
    "createdAt": "2025-10-15T..."
  },
  "aiMessage": {
    "id": "uuid",
    "content": "Hello! I'm doing well, thank you for asking...",
    "sender": "agent",
    "tokens": 45,
    "createdAt": "2025-10-15T..."
  },
  "aiMetadata": {
    "model": "gpt-4",
    "tokens": 45,
    "processingTime": 1250
  }
}
```

---

## 🧠 LLM Integration

### Configuration

Set environment variables:

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1  # Optional
```

### Supported Models

- OpenAI: `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo`
- Compatible APIs: Any OpenAI-compatible endpoint

### Features

- **Context-aware responses**: Uses conversation history and agent memories
- **Configurable parameters**: Temperature, max tokens, model selection
- **Personality integration**: System prompts enhanced with agent personality
- **Fallback responses**: Mock responses when API is unavailable
- **Token tracking**: Usage monitoring and cost estimation

---

## 🔧 Agent Tools System

Agents can be configured with various tools and capabilities:

### Tool Types

- `api`: External API integrations
- `function`: Built-in functions (calculator, etc.)
- `system`: System-level operations
- `plugin`: Custom plugins

### Example Tool Configuration

```json
{
  "name": "web_search",
  "type": "api",
  "config": {
    "apiKey": "your_search_api_key",
    "maxResults": 5,
    "safeSearch": true
  },
  "enabled": true
}
```

---

## 📋 Task Automation

Agents can execute autonomous tasks:

### Task States

- `pending`: Waiting to be processed
- `running`: Currently executing
- `completed`: Finished successfully
- `failed`: Encountered an error

### Use Cases

- Scheduled actions
- Background processing
- Multi-step workflows
- API integrations

---

## 🔒 Security & Permissions

### Authentication

- JWT token required for all endpoints
- User isolation (can only access own agents)

### Permissions

Add these permissions to roles for AI agent access:

```
- manage_ai_agents: Full agent management
- view_ai_agents: View agents and conversations
- chat_with_agents: Create conversations and messages
```

### Rate Limiting

- API key integration for external access
- Per-user conversation limits
- Token usage monitoring

---

## 🚀 Getting Started

1. **Create an Agent**:

   ```bash
   POST /api/admin/agents
   {
     "name": "My First Agent",
     "model": "gpt-4",
     "systemPrompt": "You are a helpful assistant"
   }
   ```

2. **Start a Conversation**:

   ```bash
   POST /api/admin/conversations
   {
     "agentId": "agent_uuid",
     "title": "Getting Started"
   }
   ```

3. **Send a Message**:

   ```bash
   POST /api/admin/conversations/{conversation_id}/messages
   {
     "content": "Hello! How can you help me?",
     "sender": "user"
   }
   ```

4. **Add Memories** (Optional):
   ```bash
   POST /api/admin/agents/{agent_id}/memories
   {
     "type": "knowledge_base",
     "content": "User is learning about AI systems",
     "importance": 7
   }
   ```

---

## 💡 Best Practices

### Agent Configuration

- Use descriptive names and descriptions
- Set appropriate system prompts for intended use cases
- Configure personality traits for consistent behavior
- Start with moderate temperature (0.7) and adjust based on needs

### Memory Management

- Use importance scores (1-10) to prioritize memories
- Regular cleanup of short-term memories
- Tag memories with metadata for better organization
- Store user preferences in long-term memory

### Conversation Design

- Keep conversations focused on specific topics
- Use conversation titles for easy identification
- Monitor token usage to control costs
- Implement conversation summarization for long chats

### Performance Optimization

- Cache frequent responses
- Use appropriate pagination limits
- Monitor database query performance
- Implement memory cleanup strategies

---

## 🔮 Future Enhancements

### Planned Features

- **Vector embeddings** for semantic memory search
- **Multi-modal support** (images, documents, audio)
- **Agent-to-agent communication**
- **Workflow automation** with visual builders
- **Plugin marketplace** for community tools
- **Advanced analytics** and usage insights
- **Team collaboration** features
- **API rate limiting** and quotas

### Integration Opportunities

- **Calendar scheduling** for agent tasks
- **Email integration** for notifications
- **Webhook support** for real-time events
- **File processing** capabilities
- **External database** connections

---

This AI Agent system provides a solid foundation for building sophisticated AI-powered applications while maintaining security, scalability, and ease of use.
