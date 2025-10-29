/**
 * Setup Connection Management Examples
 * Demonstrates how to use the new connection management methods
 */

import { setup } from '../setup';

/**
 * Example: Change Redis connection to a different server
 */
export async function switchRedisServer() {
  try {
    // Switch to a different Redis server
    await setup.changeRedisConnection('redis://localhost:6380');
    
    // Test the new connection
    const health = await setup.testConnections();
    console.log('Redis switch result:', health.redis);
    
    return health.redis;
  } catch (error) {
    console.error('Failed to switch Redis server:', error);
    throw error;
  }
}

/**
 * Example: Change database connection for different environments
 */
export async function switchDatabase(environment: 'development' | 'staging' | 'production') {
  try {
    const databaseUrls = {
      development: 'mysql://user:password@localhost:3306/auth_dev',
      staging: 'mysql://user:password@staging-db:3306/auth_staging',
      production: 'mysql://user:password@prod-db:3306/auth_production'
    };

    const databaseUrl = databaseUrls[environment];
    
    // Switch to the new database
    await setup.changePrismaConnection(databaseUrl);
    
    // Test the new connection
    const health = await setup.testConnections();
    console.log(`Database switch to ${environment} result:`, health.prisma);
    
    return health.prisma;
  } catch (error) {
    console.error(`Failed to switch to ${environment} database:`, error);
    throw error;
  }
}

/**
 * Example: Complete connection refresh
 */
export async function refreshConnections() {
  try {
    console.log('🔄 Refreshing all connections...');
    
    // Reconnect to all services
    await setup.reconnect();
    
    // Verify all connections are working
    const health = await setup.testConnections();
    
    if (health.prisma && health.redis) {
      console.log('✅ All connections refreshed successfully');
      return true;
    } else {
      console.log('⚠️ Some connections failed after refresh');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to refresh connections:', error);
    throw error;
  }
}

/**
 * Example: Multi-tenant database switching
 */
export async function switchTenant(tenantId: string) {
  try {
    // Build tenant-specific database URL
    const tenantDatabaseUrl = `mysql://user:password@localhost:3306/tenant_${tenantId}`;
    
    console.log(`🔄 Switching to tenant: ${tenantId}`);
    
    // Switch to tenant database
    await setup.changePrismaConnection(tenantDatabaseUrl);
    
    // Test the connection
    const health = await setup.testConnections();
    
    if (health.prisma) {
      console.log(`✅ Successfully switched to tenant ${tenantId}`);
      return true;
    } else {
      console.log(`❌ Failed to connect to tenant ${tenantId} database`);
      return false;
    }
  } catch (error) {
    console.error(`Failed to switch to tenant ${tenantId}:`, error);
    throw error;
  }
}

/**
 * Example: Connection failover
 */
export async function handleConnectionFailover() {
  try {
    const primaryRedis = 'redis://primary-redis:6379';
    const fallbackRedis = 'redis://fallback-redis:6379';
    
    // Try primary Redis first
    try {
      await setup.changeRedisConnection(primaryRedis);
      const health = await setup.testConnections();
      
      if (health.redis) {
        console.log('✅ Connected to primary Redis');
        return 'primary';
      }
    } catch (error) {
      console.log('⚠️ Primary Redis failed, trying fallback...');
    }
    
    // Fallback to secondary Redis
    await setup.changeRedisConnection(fallbackRedis);
    const health = await setup.testConnections();
    
    if (health.redis) {
      console.log('✅ Connected to fallback Redis');
      return 'fallback';
    } else {
      throw new Error('Both primary and fallback Redis servers failed');
    }
  } catch (error) {
    console.error('❌ Redis failover failed:', error);
    throw error;
  }
}

/**
 * Usage Examples:
 * 
 * // Switch Redis server
 * await switchRedisServer();
 * 
 * // Switch to staging database
 * await switchDatabase('staging');
 * 
 * // Refresh all connections
 * await refreshConnections();
 * 
 * // Switch to tenant database
 * await switchTenant('tenant_123');
 * 
 * // Handle Redis failover
 * await handleConnectionFailover();
 */