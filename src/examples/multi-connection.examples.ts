/**
 * Multi-Connection Management Examples
 * Demonstrates how to create and manage multiple database and Redis connections
 */

import { setup } from '../setup';

/**
 * Example: Create multiple database connections for different purposes
 */
export async function createMultipleDatabases() {
  try {
    console.log('🔄 Creating multiple database connections...');
    
    await setup.createMultipleDatabaseConnections([
      {
        name: 'main',
        databaseUrl: 'mysql://user:password@localhost:3306/main_db',
        setAsActive: true // This will be the default active connection
      },
      {
        name: 'analytics',
        databaseUrl: 'mysql://user:password@analytics-db:3306/analytics_db'
      },
      {
        name: 'logging',
        databaseUrl: 'mysql://user:password@logging-db:3306/logs_db'
      },
      {
        name: 'backup',
        databaseUrl: 'mysql://user:password@backup-db:3306/backup_db'
      }
    ]);
    
    console.log('✅ Multiple database connections created successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to create multiple databases:', error);
    throw error;
  }
}

/**
 * Example: Create multiple Redis connections for different use cases
 */
export async function createMultipleRedisConnections() {
  try {
    console.log('🔄 Creating multiple Redis connections...');
    
    await setup.createMultipleRedisConnections([
      {
        name: 'cache',
        redisUrl: 'redis://localhost:6379',
        setAsActive: true // This will be the default active connection
      },
      {
        name: 'sessions',
        redisUrl: 'redis://session-redis:6380'
      },
      {
        name: 'queues',
        redisUrl: 'redis://queue-redis:6381'
      },
      {
        name: 'pubsub',
        redisUrl: 'redis://pubsub-redis:6382'
      }
    ]);
    
    console.log('✅ Multiple Redis connections created successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to create multiple Redis connections:', error);
    throw error;
  }
}

/**
 * Example: Use specific database connections for different operations
 */
export async function useSpecificDatabases() {
  try {
    // Use main database for user operations
    const mainDb = setup.getDatabaseConnection('main');
    const users = await mainDb.user.findMany();
    console.log('👥 Users from main database:', users.length);
    
    // Use analytics database for reporting (using existing schema)
    const analyticsDb = setup.getDatabaseConnection('analytics');
    const roles = await analyticsDb.role.findMany();
    console.log('📊 Roles from analytics database:', roles.length);
    
    // Use logging database for system logs (using existing schema)
    const loggingDb = setup.getDatabaseConnection('logging');
    const permissions = await loggingDb.permission.findMany({ take: 10 });
    console.log('📝 Recent permissions:', permissions.length);
    
    return { users, roles, permissions };
  } catch (error) {
    console.error('❌ Failed to use specific databases:', error);
    throw error;
  }
}

/**
 * Example: Use specific Redis connections for different purposes
 */
export async function useSpecificRedisConnections() {
  try {
    // Use cache Redis for caching
    const cacheRedis = setup.getRedisConnection('cache');
    await cacheRedis.set('user:123', JSON.stringify({ name: 'John' }));
    const cachedUser = await cacheRedis.get('user:123');
    console.log('💾 Cached user:', cachedUser);
    
    // Use sessions Redis for session management
    const sessionsRedis = setup.getRedisConnection('sessions');
    await sessionsRedis.set('session:abc123', 'active', { EX: 3600 });
    console.log('🔐 Session stored');
    
    // Use queues Redis for job queues
    const queuesRedis = setup.getRedisConnection('queues');
    await queuesRedis.lPush('email-queue', JSON.stringify({ to: 'user@example.com' }));
    console.log('📮 Job queued');
    
    return { cachedUser };
  } catch (error) {
    console.error('❌ Failed to use specific Redis connections:', error);
    throw error;
  }
}

/**
 * Example: Switch between active connections
 */
export async function switchActiveConnections() {
  try {
    console.log('🔄 Switching active connections...');
    
    // List current connections
    const connections = setup.listAllConnections();
    console.log('📋 Available connections:', connections);
    
    // Switch active database to analytics
    setup.switchActiveDatabaseConnection('analytics');
    console.log('✅ Switched active database to analytics');
    
    // Switch active Redis to sessions
    setup.switchActiveRedisConnection('sessions');
    console.log('✅ Switched active Redis to sessions');
    
    // Now setup.prisma will use analytics DB and setup.redis will use sessions Redis
    const currentDb = setup.prisma; // This is now the analytics database
    const currentRedis = setup.redis; // This is now the sessions Redis
    
    return { currentDb, currentRedis };
  } catch (error) {
    console.error('❌ Failed to switch active connections:', error);
    throw error;
  }
}

/**
 * Example: Test all connections health
 */
export async function testAllConnectionsHealth() {
  try {
    console.log('🧪 Testing all connection health...');
    
    const healthResults = await setup.testAllConnections();
    
    console.log('🏥 Health Results:');
    console.log('Database connections:', healthResults.databases);
    console.log('Redis connections:', healthResults.redis);
    console.log('Summary:', healthResults.summary);
    
    // Check if all connections are healthy
    const allDatabasesHealthy = Object.values(healthResults.databases).every(Boolean);
    const allRedisHealthy = Object.values(healthResults.redis).every(Boolean);
    
    if (allDatabasesHealthy && allRedisHealthy) {
      console.log('✅ All connections are healthy');
      return { status: 'healthy', results: healthResults };
    } else {
      console.log('⚠️ Some connections are unhealthy');
      return { status: 'partial', results: healthResults };
    }
  } catch (error) {
    console.error('❌ Health check failed:', error);
    throw error;
  }
}

/**
 * Example: Multi-tenant application with dedicated databases
 */
export async function setupMultiTenantDatabases(tenants: string[]) {
  try {
    console.log('🏢 Setting up multi-tenant databases...');
    
    const databaseConnections = tenants.map(tenant => ({
      name: `tenant_${tenant}`,
      databaseUrl: `mysql://user:password@localhost:3306/tenant_${tenant}_db`
    }));
    
    await setup.createMultipleDatabaseConnections(databaseConnections);
    
    console.log(`✅ Created databases for ${tenants.length} tenants`);
    return databaseConnections.map(conn => conn.name);
  } catch (error) {
    console.error('❌ Failed to setup multi-tenant databases:', error);
    throw error;
  }
}

/**
 * Example: Load balancing with multiple Redis instances
 */
export async function setupRedisLoadBalancing() {
  try {
    console.log('⚖️ Setting up Redis load balancing...');
    
    await setup.createMultipleRedisConnections([
      { name: 'redis_1', redisUrl: 'redis://redis1:6379' },
      { name: 'redis_2', redisUrl: 'redis://redis2:6379' },
      { name: 'redis_3', redisUrl: 'redis://redis3:6379' }
    ]);
    
    // Simple round-robin function
    let currentIndex = 0;
    const redisInstances = ['redis_1', 'redis_2', 'redis_3'];
    
    const getNextRedis = () => {
      const instance = redisInstances[currentIndex];
      currentIndex = (currentIndex + 1) % redisInstances.length;
      return setup.getRedisConnection(instance);
    };
    
    // Example usage
    for (let i = 0; i < 9; i++) {
      const redis = getNextRedis();
      await redis.set(`key_${i}`, `value_${i}`);
      console.log(`🔄 Stored key_${i} in Redis instance ${currentIndex === 0 ? 3 : currentIndex}`);
    }
    
    return getNextRedis;
  } catch (error) {
    console.error('❌ Failed to setup Redis load balancing:', error);
    throw error;
  }
}

/**
 * Example: Connection management with cleanup
 */
export async function manageConnectionLifecycle() {
  try {
    console.log('🔄 Managing connection lifecycle...');
    
    // Create temporary connections
    await setup.createMultipleDatabaseConnections([
      { name: 'temp_db', databaseUrl: 'mysql://user:password@temp-db:3306/temp_db' }
    ]);
    
    await setup.createMultipleRedisConnections([
      { name: 'temp_redis', redisUrl: 'redis://temp-redis:6379' }
    ]);
    
    console.log('✅ Temporary connections created');
    
    // Use them for some operations
    const tempDb = setup.getDatabaseConnection('temp_db');
    const tempRedis = setup.getRedisConnection('temp_redis');
    
    // ... perform operations ...
    
    // Clean up specific connections
    await setup.removeConnection('database', 'temp_db');
    await setup.removeConnection('redis', 'temp_redis');
    
    console.log('✅ Temporary connections cleaned up');
    
    return true;
  } catch (error) {
    console.error('❌ Connection lifecycle management failed:', error);
    throw error;
  }
}

/**
 * Usage Examples:
 * 
 * // Setup multiple connections
 * await createMultipleDatabases();
 * await createMultipleRedisConnections();
 * 
 * // Use specific connections
 * await useSpecificDatabases();
 * await useSpecificRedisConnections();
 * 
 * // Switch active connections
 * await switchActiveConnections();
 * 
 * // Health monitoring
 * await testAllConnectionsHealth();
 * 
 * // Multi-tenant setup
 * await setupMultiTenantDatabases(['tenant1', 'tenant2', 'tenant3']);
 * 
 * // Load balancing
 * const getNextRedis = await setupRedisLoadBalancing();
 * 
 * // Connection lifecycle
 * await manageConnectionLifecycle();
 */