/**
 * Advanced Setup Connection Management Examples
 * Demonstrates the new database service integration methods
 */

import { setup } from '../setup';

/**
 * Example: Switch database using connection name from database service
 */
export async function switchToDatabaseByName(connectionName: string) {
  try {
    console.log(`🔄 Switching to database: ${connectionName}`);
    
    // Switch using database service lookup
    await setup.switchDatabaseConnection(connectionName);
    
    // Test the connection
    const health = await setup.testConnections();
    
    if (health.prisma) {
      console.log(`✅ Successfully connected to database: ${connectionName}`);
      return true;
    } else {
      console.log(`❌ Failed to connect to database: ${connectionName}`);
      return false;
    }
  } catch (error) {
    console.error(`Failed to switch to database ${connectionName}:`, error);
    throw error;
  }
}

/**
 * Example: Switch Redis using connection ID from database service
 */
export async function switchToRedisById(connectionId: string) {
  try {
    console.log(`🔄 Switching to Redis connection ID: ${connectionId}`);
    
    // Switch using database service lookup by ID
    await setup.switchRedisConnection(undefined, connectionId);
    
    // Test the connection
    const health = await setup.testConnections();
    
    if (health.redis) {
      console.log(`✅ Successfully connected to Redis ID: ${connectionId}`);
      return true;
    } else {
      console.log(`❌ Failed to connect to Redis ID: ${connectionId}`);
      return false;
    }
  } catch (error) {
    console.error(`Failed to switch to Redis ${connectionId}:`, error);
    throw error;
  }
}

/**
 * Example: Switch to environment-specific connections
 */
export async function switchEnvironment(env: 'development' | 'staging' | 'production') {
  try {
    console.log(`🌍 Switching to ${env} environment...`);
    
    await setup.switchToEnvironment(env);
    
    // Get current active connections info
    const activeConnections = await setup.getActiveConnections();
    console.log('Active connections:', activeConnections);
    
    return activeConnections;
  } catch (error) {
    console.error(`Failed to switch to ${env} environment:`, error);
    throw error;
  }
}

/**
 * Example: List all available connections
 */
export async function showAvailableConnections() {
  try {
    console.log('📋 Listing all available database connections...');
    
    const connections = await setup.listDatabaseConnections();
    
    console.log('Available connections:');
    connections.forEach(conn => {
      console.log(`- ${conn.name} (${conn.type}) - ${conn.host}:${conn.port}/${conn.database} - Active: ${conn.isActive}`);
    });
    
    return connections;
  } catch (error) {
    console.error('Failed to list connections:', error);
    throw error;
  }
}

/**
 * Example: Failover to backup connections
 */
export async function performFailover() {
  try {
    console.log('🆘 Performing failover to backup connections...');
    
    // Switch to backup connections
    await setup.switchToBackupConnections();
    
    // Verify failover success
    const health = await setup.testConnections();
    
    if (health.prisma && health.redis) {
      console.log('✅ Failover successful - all backup connections working');
      return { success: true, message: 'Failover completed successfully' };
    } else {
      console.log('⚠️ Partial failover - some connections failed');
      return { success: false, message: 'Partial failover completed', health };
    }
  } catch (error) {
    console.error('❌ Failover failed:', error);
    return { success: false, message: 'Failover failed', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Example: Auto-detect and switch to active connections
 */
export async function autoSwitchToActiveConnections() {
  try {
    console.log('🔍 Auto-detecting active connections...');
    
    // Switch to default active database (no name specified = auto-detect active)
    await setup.switchDatabaseConnection();
    console.log('✅ Switched to active database connection');
    
    // Switch to default active Redis
    await setup.switchRedisConnection();
    console.log('✅ Switched to active Redis connection');
    
    // Get info about what we connected to
    const activeConnections = await setup.getActiveConnections();
    console.log('Connected to:', activeConnections);
    
    return activeConnections;
  } catch (error) {
    console.error('Failed auto-switch:', error);
    throw error;
  }
}

/**
 * Example: Connection health monitoring with automatic switching
 */
export async function monitorAndSwitchConnections() {
  try {
    console.log('🔍 Starting connection monitoring...');
    
    // Test current connections
    let health = await setup.testConnections();
    console.log('Current health:', health);
    
    // If database is down, try to switch to backup
    if (!health.prisma) {
      console.log('🆘 Database connection failed, switching to backup...');
      try {
        await setup.switchDatabaseConnection('backup-db');
        console.log('✅ Switched to backup database');
      } catch (error) {
        console.log('❌ No backup database available');
      }
    }
    
    // If Redis is down, try to switch to backup
    if (!health.redis) {
      console.log('🆘 Redis connection failed, switching to backup...');
      try {
        await setup.switchRedisConnection('backup-redis');
        console.log('✅ Switched to backup Redis');
      } catch (error) {
        console.log('❌ No backup Redis available');
      }
    }
    
    // Test again after potential switches
    health = await setup.testConnections();
    console.log('Health after switches:', health);
    
    return health;
  } catch (error) {
    console.error('Connection monitoring failed:', error);
    throw error;
  }
}

/**
 * Usage Examples:
 * 
 * // Switch to specific database by name
 * await switchToDatabaseByName('production-main');
 * 
 * // Switch to Redis by ID
 * await switchToRedisById('redis-123');
 * 
 * // Switch entire environment
 * await switchEnvironment('production');
 * 
 * // List all available connections
 * await showAvailableConnections();
 * 
 * // Perform failover
 * await performFailover();
 * 
 * // Auto-switch to active connections
 * await autoSwitchToActiveConnections();
 * 
 * // Monitor and auto-switch
 * await monitorAndSwitchConnections();
 */