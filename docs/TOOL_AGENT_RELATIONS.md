# Tool-Agent Relations Implementation

## Overview
Updated the tool service, repository, controller, and routes to return tools with their related agents (many-to-many relationship via `AgentTool` junction table).

## Changes Made

### 1. Repository Layer (`tool.repository.ts`)
Added new methods to fetch tools with agent relations:

- **`listAgentTools(agentId)`** - Updated to include agent and model information
- **`findAllWithAgents()`** - NEW: List all tools with their related agents
- **`findByIdWithAgents(id)`** - NEW: Find a specific tool with its related agents

All methods now include:
```typescript
include: {
  agents: {
    include: {
      agent: {
        include: {
          model: true  // AIModel relation
        }
      }
    }
  }
}
```

### 2. Service Layer (`tool.service.ts`)
Updated methods to return agent relations:

- **`listTools(agentId?)`** - Returns tools with parsed config and agent details
  - When `agentId` provided: Returns tools for that specific agent with agent info
  - Without `agentId`: Returns all tools with all related agents
  
- **`listAgentTools(agentId)`** - Returns tools for a specific agent with agent and model info

- **`getToolWithAgents(id)`** - NEW: Get a single tool with all its related agents

Each tool now includes an `agents` array with:
```typescript
{
  id: string,
  name: string,
  description: string,
  model: AIModel,  // The AI model used by the agent
  createdAt: Date   // When the agent-tool relation was created
}
```

### 3. Controller Layer (`tool.controller.ts`)
Added new controller method and updated create/update methods:

- **`create()`** - Override to handle many-to-many agent relations via `relatedAgentIds`
- **`update()`** - Override to handle many-to-many agent relations via `relatedAgentIds`
- **`getToolWithAgents(req, res)`** - NEW: GET endpoint to fetch tool with agents

The controller now properly transforms the `relatedAgentIds` array from the frontend into the correct Prisma nested write format:

```typescript
// Frontend sends:
{
  name: "Web Search",
  type: "api",
  relatedAgentIds: ["agent-1", "agent-2"]
}

// Controller transforms to:
{
  name: "Web Search",
  type: "api",
  agents: {
    create: [
      { agent: { connect: { id: "agent-1" } } },
      { agent: { connect: { id: "agent-2" } } }
    ]
  }
}
```

For updates, the controller first deletes all existing agent relations, then creates new ones:

```typescript
agents: {
  deleteMany: {},  // Remove all existing relations
  create: [...]    // Create new relations
}
```

### 4. Routes Layer (`tool.routes.ts`)
Added new route:

```typescript
GET /api/tools/:id/with-agents
```

**Note:** This route must be defined BEFORE the `/:id` route to avoid routing conflicts.

## API Endpoints

### Create Tool with Agents
```http
POST /api/tools
Content-Type: application/json

{
  "name": "Web Search",
  "description": "Search the web",
  "type": "api",
  "config": {
    "endpoint": "https://api.search.com"
  },
  "enabled": true,
  "relatedAgentIds": ["agent-456", "agent-789"]
}
```

### Update Tool with Agents
```http
PUT /api/tools/:id
Content-Type: application/json

{
  "name": "Web Search Updated",
  "relatedAgentIds": ["agent-456"]  // Replaces all existing agent relations
}
```

### Get All Tools with Agents
```http
GET /api/tools
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tool-123",
      "name": "web-search",
      "description": "Search the web",
      "type": "api",
      "config": { "endpoint": "https://api.search.com" },
      "enabled": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z",
      "agents": [
        {
          "id": "agent-456",
          "name": "Research Assistant",
          "description": "Helps with research",
          "model": {
            "id": "model-789",
            "name": "GPT-4",
            "type": "gpt"
          },
          "createdAt": "2025-01-01T00:00:00Z"
        }
      ]
    }
  ]
}
```

### Get Tools for Specific Agent
```http
GET /api/tools?agentId=agent-456
```

**Response:** Same structure as above, filtered to the specified agent.

### Get Single Tool with Agents
```http
GET /api/tools/:id/with-agents
```

**Response:** Single tool object with full agent relations.

### Get Tools for Agent (Alternative)
```http
GET /api/tools/agent/:agentId
```

**Response:** List of tools for the specific agent with agent details.

## Database Schema
The many-to-many relationship is managed through the `AgentTool` junction table:

```prisma
model AgentTool {
  id        String   @id @default(uuid())
  agentId   String
  toolId    String
  agent     Agent    @relation(fields: [agentId], references: [id], onDelete: Cascade)
  tool      Tool     @relation(fields: [toolId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([agentId, toolId])
  @@map("agent_tool")
}
```

## Benefits

1. **Complete Context**: Frontend can now display which agents use each tool
2. **AI Model Information**: Each agent includes its AI model (GPT-4, Claude, etc.)
3. **Relationship Metadata**: Includes when the agent-tool relation was created
4. **Backward Compatible**: Existing endpoints still work; new features are additive
5. **Efficient Queries**: Uses Prisma's `include` to fetch all data in a single query

## Frontend Integration

The frontend can now display tools with their related agents:

```tsx
// Example: Display tools in a table
{tools.map(tool => (
  <ToolRow key={tool.id}>
    <ToolName>{tool.name}</ToolName>
    <RelatedAgents>
      {tool.agents.map(agent => (
        <AgentTag key={agent.id}>
          {agent.name} ({agent.model?.name})
        </AgentTag>
      ))}
    </RelatedAgents>
  </ToolRow>
))}
```

## Migration Notes

- No database migration required (schema already supports many-to-many)
- Existing code will continue to work
- Update frontend to consume the new `agents` field in responses
- The `config` field is automatically parsed from JSON string to object

## Testing

Test the following scenarios:
1. ✅ List all tools with agents: `GET /api/tools`
2. ✅ List tools for specific agent: `GET /api/tools?agentId=xxx`
3. ✅ Get single tool with agents: `GET /api/tools/:id/with-agents`
4. ✅ Get agent's tools: `GET /api/tools/agent/:agentId`
5. ✅ Verify config parsing (JSON string → object)
6. ✅ Verify agent model inclusion in response
