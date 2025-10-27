# Tool API Endpoints

Base URL: `/api/admin/tools`

## General Tool Endpoints

### List All Tools
- **GET** `/api/admin/tools`
- **Query Params**: `?agentId=xxx` (optional)
- **Description**: List all tools, optionally filtered by agentId
- **Response**: 
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "string",
        "agentId": "string | null",
        "name": "string",
        "description": "string | null",
        "type": "string",
        "config": "object | null",
        "enabled": "boolean"
      }
    ]
  }
  ```

### Create Tool
- **POST** `/api/admin/tools`
- **Body**: 
  ```json
  {
    "agentId": "string | null",
    "name": "string",
    "description": "string",
    "type": "string",
    "config": "object",
    "enabled": "boolean"
  }
  ```
- **Description**: Create a new tool
- **Response**: Created tool object

### Search Tools by Name
- **GET** `/api/admin/tools/search`
- **Query Params**: `?name=xxx` (required)
- **Description**: Search tools by name (partial matching)
- **Response**: Array of matching tools

### Get Global Tools
- **GET** `/api/admin/tools/global`
- **Description**: Get all global tools (not associated with any agent)
- **Response**: Array of global tools

### Get Tools by Type
- **GET** `/api/admin/tools/type/:type`
- **Description**: Get all tools of a specific type
- **Response**: Array of tools matching the type

### Get Tool by ID
- **GET** `/api/admin/tools/:id`
- **Description**: Get a single tool by ID
- **Response**: Tool object

### Update Tool
- **PUT** `/api/admin/tools/:id`
- **Body**: Partial tool object
- **Description**: Update a tool by ID
- **Response**: Updated tool object

### Delete Tool
- **DELETE** `/api/admin/tools/:id`
- **Description**: Delete a tool by ID
- **Response**: Success message

---

## Agent-Specific Tool Endpoints

### List Agent Tools
- **GET** `/api/admin/tools/agent/:agentId`
- **Description**: List all tools for a specific agent
- **Response**: Array of tools for the agent

### Delete Agent Tools
- **DELETE** `/api/admin/tools/agent/:agentId`
- **Description**: Delete all tools for a specific agent
- **Response**: 
  ```json
  {
    "success": true,
    "data": { "count": 5 },
    "message": "Deleted 5 tool(s)"
  }
  ```

### Get Enabled Tools
- **GET** `/api/admin/tools/agent/:agentId/enabled`
- **Description**: Get all enabled tools for an agent
- **Response**: Array of enabled tools

### Get Disabled Tools
- **GET** `/api/admin/tools/agent/:agentId/disabled`
- **Description**: Get all disabled tools for an agent
- **Response**: Array of disabled tools

### Count Agent Tools
- **GET** `/api/admin/tools/agent/:agentId/count`
- **Query Params**: `?enabledOnly=true` (optional)
- **Description**: Count tools for an agent
- **Response**: 
  ```json
  {
    "success": true,
    "data": { "count": 10 }
  }
  ```

### Check Tool Exists
- **GET** `/api/admin/tools/agent/:agentId/has/:name`
- **Description**: Check if a tool exists for an agent
- **Response**: 
  ```json
  {
    "success": true,
    "data": { "exists": true }
  }
  ```

### Enable Tool
- **PUT** `/api/admin/tools/agent/:agentId/enable/:name`
- **Description**: Enable a specific tool for an agent
- **Response**: 
  ```json
  {
    "success": true,
    "data": { "count": 1 },
    "message": "Enabled 1 tool(s)"
  }
  ```

### Disable Tool
- **PUT** `/api/admin/tools/agent/:agentId/disable/:name`
- **Description**: Disable a specific tool for an agent
- **Response**: 
  ```json
  {
    "success": true,
    "data": { "count": 1 },
    "message": "Disabled 1 tool(s)"
  }
  ```

### Toggle Tool
- **PUT** `/api/admin/tools/agent/:agentId/toggle/:name`
- **Description**: Toggle tool enabled status for an agent
- **Response**: 
  ```json
  {
    "success": true,
    "data": { "id": "...", "enabled": true },
    "message": "Tool is now enabled"
  }
  ```

### Enable All Tools
- **PUT** `/api/admin/tools/agent/:agentId/enable-all`
- **Description**: Enable all tools for an agent
- **Response**: 
  ```json
  {
    "success": true,
    "data": { "count": 5 },
    "message": "Enabled 5 tool(s)"
  }
  ```

### Disable All Tools
- **PUT** `/api/admin/tools/agent/:agentId/disable-all`
- **Description**: Disable all tools for an agent
- **Response**: 
  ```json
  {
    "success": true,
    "data": { "count": 5 },
    "message": "Disabled 5 tool(s)"
  }
  ```

---

## Usage Examples

### Enable a tool for an agent
```bash
curl -X PUT http://localhost:3000/api/admin/tools/agent/agent-123/enable/web-search \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### List all tools for an agent
```bash
curl http://localhost:3000/api/admin/tools/agent/agent-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Search for tools by name
```bash
curl "http://localhost:3000/api/admin/tools/search?name=search" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create a new tool
```bash
curl -X POST http://localhost:3000/api/admin/tools \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent-123",
    "name": "code-analyzer",
    "description": "Analyzes code for best practices",
    "type": "analyzer",
    "config": { "language": "typescript" },
    "enabled": true
  }'
```

---

## Authentication

All endpoints require authentication via:
- JWT Token (Bearer token in Authorization header)
- SSO Key validation
- API Key validation

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Error message"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Tool not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error message"
}
```
