# Multi-Connection Management System

The Multi-Connection Management System allows your application to manage multiple database and Redis connections simultaneously, with dynamic switching capabilities, health monitoring, and advanced connection lifecycle management.

## Features

- **Multiple Simultaneous Connections**: Create and maintain unlimited database and Redis connections
- **Dynamic Connection Switching**: Switch active connections at runtime without restart
- **Health Monitoring**: Monitor connection health across all active connections
- **Environment Management**: Environment-specific connection configuration
- **Multi-Tenant Support**: Tenant-specific database connections
- **Load Balancing**: Distribute Redis operations across multiple instances
- **Failover Support**: Automatic failover to backup connections
- **Connection Lifecycle**: Complete connection creation, management, and cleanup

## Architecture

### Core Components

1. **Setup Class**: Central connection manager with singleton pattern
2. **DatabaseService**: Simplified repository access layer
3. **Multi-Connection API**: REST endpoints for connection management
4. **Examples Library**: Comprehensive usage examples

### Storage Structure

```typescript
// In Setup class:
private _multiPrismaConnections: Map<string, PrismaClient> = new Map();
private _multiRedisConnections: Map<string, RedisClient> = new Map();
private _activePrismaConnection: string = 'default';
private _activeRedisConnection: string = 'default';
```

## Usage Guide

### 1. Creating Multiple Database Connections

```typescript
import { Setup } from './setup';

const setup = Setup.getInstance();

// Define database configurations
const dbConfigs = [
  {
    name: 'primary',
    url: 'mysql://user:pass@localhost:3306/app_primary'
  },
  {
    name: 'analytics',
    url: 'mysql://user:pass@localhost:3306/app_analytics'
  },
  {
    name: 'reporting',
    url: 'mysql://user:pass@localhost:3306/app_reporting'
  }
];

// Create connections
const results = await setup.createMultipleDatabaseConnections(dbConfigs);
console.log('Created databases:', results.successful);
console.log('Failed databases:', results.failed);
```

### 2. Creating Multiple Redis Connections

```typescript
// Define Redis configurations
const redisConfigs = [
  {
    name: 'cache',
    url: 'redis://localhost:6379/0'
  },
  {
    name: 'sessions',
    url: 'redis://localhost:6379/1'
  },
  {
    name: 'queue',
    url: 'redis://localhost:6379/2'
  }
];

// Create connections
const results = await setup.createMultipleRedisConnections(redisConfigs);
console.log('Created Redis:', results.successful);
```

### 3. Switching Active Connections

```typescript
// Switch database connection
await setup.switchActiveDatabaseConnection('analytics');

// Switch Redis connection
await setup.switchActiveRedisConnection('sessions');

// Now all operations will use the new active connections
import { DatabaseService } from './database.service';
const db = new DatabaseService();
const users = await db.repository.user.findMany(); // Uses 'analytics' database
```

### 4. Getting Specific Connections

```typescript
// Get specific database connection
const analyticsDb = setup.getDatabaseConnection('analytics');
const reports = await analyticsDb.report.findMany();

// Get specific Redis connection
const cacheRedis = setup.getRedisConnection('cache');
await cacheRedis.set('key', 'value');
```

### 5. Connection Health Monitoring

```typescript
// Test all connections
const health = await setup.testAllMultiConnections();
console.log('Database health:', health.database);
console.log('Redis health:', health.redis);
console.log('Details:', health.details);

// Test specific connections
const specificHealth = await setup.testSpecificConnections({
  database: 'analytics',
  redis: 'cache'
});
```

### 6. Listing Active Connections

```typescript
const connections = setup.listAllMultiConnections();
console.log('Database connections:', connections.databases);
console.log('Redis connections:', connections.redis);

// Output example:
// {
//   databases: [
//     { name: 'primary', isActive: true },
//     { name: 'analytics', isActive: false }
//   ],
//   redis: [
//     { name: 'cache', isActive: false },
//     { name: 'sessions', isActive: true }
//   ]
// }
```

### 7. Removing Connections

```typescript
// Remove specific database connection
await setup.removeMultiConnection('database', 'analytics');

// Remove specific Redis connection
await setup.removeMultiConnection('redis', 'cache');
```

## REST API Endpoints

The system provides comprehensive REST API endpoints for connection management:

### Create Multiple Database Connections
```http
POST /api/admin/connections/multi/database
Content-Type: application/json

{
  "connections": [
    {
      "name": "tenant1",
      "url": "mysql://user:pass@localhost:3306/tenant1_db"
    },
    {
      "name": "tenant2", 
      "url": "mysql://user:pass@localhost:3306/tenant2_db"
    }
  ]
}
```

### Create Multiple Redis Connections
```http
POST /api/admin/connections/multi/redis
Content-Type: application/json

{
  "connections": [
    {
      "name": "cache_primary",
      "url": "redis://localhost:6379/0"
    },
    {
      "name": "cache_secondary",
      "url": "redis://localhost:6379/1"
    }
  ]
}
```

### Switch Active Database Connection
```http
POST /api/admin/connections/multi/switch/database
Content-Type: application/json

{
  "connectionName": "tenant2"
}
```

### Switch Active Redis Connection
```http
POST /api/admin/connections/multi/switch/redis
Content-Type: application/json

{
  "connectionName": "cache_secondary"
}
```

### List All Connections
```http
GET /api/admin/connections/multi/list
```

### Test Connection Health
```http
GET /api/admin/connections/multi/health
```

### Remove Connection
```http
DELETE /api/admin/connections/multi/remove
Content-Type: application/json

{
  "type": "database",
  "connectionName": "tenant1"
}
```

### Setup Multi-Tenant Databases
```http
POST /api/admin/connections/multi/tenant/setup
Content-Type: application/json

{
  "tenants": ["tenant1", "tenant2", "tenant3"],
  "baseUrl": "mysql://user:pass@localhost:3306/"
}
```

## Advanced Use Cases

### 1. Multi-Tenant Architecture

```typescript
// Setup tenant-specific databases
const tenants = ['acme', 'globex', 'initech'];
const baseUrl = 'mysql://user:pass@localhost:3306/';

const tenantConfigs = tenants.map(tenant => ({
  name: `tenant_${tenant}`,
  url: `${baseUrl}${tenant}_database`
}));

await setup.createMultipleDatabaseConnections(tenantConfigs);

// Switch to specific tenant
async function switchToTenant(tenantId: string) {
  await setup.switchActiveDatabaseConnection(`tenant_${tenantId}`);
}
```

### 2. Load Balancing Redis Operations

```typescript
// Setup multiple Redis instances
const redisInstances = [
  { name: 'redis_1', url: 'redis://redis1:6379' },
  { name: 'redis_2', url: 'redis://redis2:6379' },
  { name: 'redis_3', url: 'redis://redis3:6379' }
];

await setup.createMultipleRedisConnections(redisInstances);

// Round-robin Redis selection
let currentRedis = 0;
function getNextRedisConnection() {
  const instances = setup.listAllMultiConnections().redis;
  const selectedInstance = instances[currentRedis % instances.length];
  currentRedis++;
  return setup.getRedisConnection(selectedInstance.name);
}
```

### 3. Environment-Based Connections

```typescript
// Environment-specific database setup
const environment = process.env.NODE_ENV || 'development';

const envConfigs = {
  development: [
    { name: 'dev_primary', url: 'mysql://localhost:3306/app_dev' }
  ],
  staging: [
    { name: 'staging_primary', url: 'mysql://staging:3306/app_staging' }
  ],
  production: [
    { name: 'prod_primary', url: 'mysql://prod-primary:3306/app_prod' },
    { name: 'prod_replica', url: 'mysql://prod-replica:3306/app_prod' }
  ]
};

await setup.createMultipleDatabaseConnections(envConfigs[environment]);
```

### 4. Failover and High Availability

```typescript
// Setup primary and backup connections
const haConfigs = [
  { name: 'primary', url: 'mysql://primary:3306/app' },
  { name: 'backup', url: 'mysql://backup:3306/app' }
];

await setup.createMultipleDatabaseConnections(haConfigs);

// Failover logic
async function executeWithFailover<T>(operation: (db: PrismaClient) => Promise<T>): Promise<T> {
  try {
    const primaryDb = setup.getDatabaseConnection('primary');
    return await operation(primaryDb);
  } catch (error) {
    console.log('Primary failed, switching to backup...');
    const backupDb = setup.getDatabaseConnection('backup');
    await setup.switchActiveDatabaseConnection('backup');
    return await operation(backupDb);
  }
}
```

## Best Practices

### 1. Connection Naming Convention

- Use descriptive names: `tenant_acme`, `cache_sessions`, `analytics_db`
- Include environment prefixes: `prod_primary`, `dev_cache`
- Use consistent patterns across your application

### 2. Error Handling

```typescript
try {
  await setup.createMultipleDatabaseConnections(configs);
} catch (error) {
  console.error('Failed to create connections:', error);
  // Implement fallback strategy
}
```

### 3. Health Monitoring

```typescript
// Regular health checks
setInterval(async () => {
  const health = await setup.testAllMultiConnections();
  if (!health.database.healthy || !health.redis.healthy) {
    // Alert administrators or trigger failover
  }
}, 30000); // Check every 30 seconds
```

### 4. Resource Management

```typescript
// Proper cleanup on application shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await setup.disconnectAll();
  process.exit(0);
});
```

### 5. Configuration Management

```typescript
// Use environment variables for connection URLs
const configs = [
  {
    name: 'primary',
    url: process.env.DATABASE_PRIMARY_URL || 'mysql://localhost:3306/app'
  },
  {
    name: 'analytics',
    url: process.env.DATABASE_ANALYTICS_URL || 'mysql://localhost:3306/analytics'
  }
];
```

## Testing

Use the provided test suite to verify your multi-connection setup:

```bash
# Run the test suite
npx ts-node src/tests/multi-connection.test.ts
```

The test suite verifies:
- Connection creation and management
- Active connection switching
- Health monitoring functionality
- Environment switching capabilities
- Connection cleanup

## Performance Considerations

1. **Connection Pooling**: Each Prisma client manages its own connection pool
2. **Memory Usage**: Monitor memory usage with multiple active connections
3. **Connection Limits**: Respect database connection limits
4. **Health Checks**: Balance monitoring frequency with performance impact

## Migration Guide

### From Single Connection to Multi-Connection

1. **Update Setup Usage**:
   ```typescript
   // Old way
   const prisma = setup.prisma;
   
   // New way (still works)
   const prisma = setup.prisma; // Uses active connection
   
   // Or explicit connection
   const prisma = setup.getDatabaseConnection('primary');
   ```

2. **Update Service Classes**:
   ```typescript
   // Services automatically use the active connection
   const db = new DatabaseService();
   const users = await db.repository.user.findMany();
   ```

3. **Add Connection Configuration**:
   ```typescript
   // Add to your application startup
   await setup.createMultipleDatabaseConnections(yourConfigs);
   ```

## Support and Troubleshooting

### Common Issues

1. **Connection Limit Exceeded**: Reduce number of connections or increase database limits
2. **Type Conflicts**: Ensure consistent Redis client versions
3. **Memory Leaks**: Properly close unused connections
4. **Health Check Failures**: Verify network connectivity and credentials

### Debug Mode

Enable debug logging by setting environment variable:
```bash
export DEBUG=setup:multi-connection
```

This comprehensive multi-connection system provides enterprise-level connection management capabilities while maintaining backward compatibility and ease of use.