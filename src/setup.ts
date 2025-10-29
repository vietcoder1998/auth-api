import { PrismaClient } from '@prisma/client';
import * as rd from 'redis';
import { REDIS_URL } from './env';
import { checkRedisConnection } from './utils/validationUtils';
import { databaseConnectionService } from './services/database-connection.service';
        
/**
 * Setup Service
 * Manages database connections and provides a centralized interface
 */
const redisClient = rd.createClient({ url: REDIS_URL });

export class Setup {
  private static instance: Setup;
  public _prisma: PrismaClient | null = null;
  public _redisClient: any = redisClient;
  private _isConnected: boolean = false;
  private _connectionPromise: Promise<void> | null = null;
  private databaseConnectionService = databaseConnectionService;

  public constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): Setup {
    if (!Setup.instance) {
      Setup.instance = new Setup();
    }
    return Setup.instance;
  }

  /**
   * Connect to databases
   */
  public async connect(): Promise<void> {
    if (this._isConnected) return;

    console.log('🔌 Connecting...');

    // Prisma
    this._prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
    await this._prisma.$connect();
    console.log('✅ Prisma connected');

    // Redis
    if (this._redisClient) {
      (this._redisClient as rd.RedisClientType).on('error', (err: Error) =>
        console.error('❌ Redis Error:', err),
      );
      await this._redisClient.connect();
      console.log('✅ Redis connected');
    }

    this._isConnected = true;
    console.log('🚀 Setup complete');
  }

  /**
   * Disconnect from databases
   */
  public async disconnect(): Promise<void> {
    console.log('🔌 Disconnecting...');

    if (this._prisma) {
      await this._prisma.$disconnect();
      this._prisma = null;
    }

    if (this._redisClient) {
      await this._redisClient.disconnect();
      this._redisClient = null;
    }

    this._isConnected = false;
    console.log('👋 Disconnected');
  }

  /**
   * Get Prisma client
   */
  get prisma(): PrismaClient {
    if (!this._prisma) {
      throw new Error('Prisma not ready yet. Setup is initializing...');
    }
    return this._prisma;
  }

  /**
   * Get Redis client
   */
  get redis(): rd.RedisClientType {
    if (!this._redisClient) {
      throw new Error('Redis not ready yet. Setup is initializing...');
    }
    return this._redisClient;
  }

  /**
   * Wait for connection to complete
   */
  async waitForConnection(): Promise<void> {
    if (this._connectionPromise) {
      await this._connectionPromise;
    }
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ prisma: boolean; redis: boolean }> {
    const health = { prisma: false, redis: false };

    try {
      if (this._prisma) {
        await this._prisma.$queryRaw`SELECT 1`;
        health.prisma = true;
      }
    } catch {}

    try {
      if (this._redisClient?.isOpen) {
        await this._redisClient.ping();
        health.redis = true;
      }
    } catch {}

    return health;
  }

  /**
   * Change Redis connection
   */
  public async changeRedisConnection(redisUrl: string): Promise<void> {
    console.log('🔄 Changing Redis connection...');

    // Disconnect existing Redis client if connected
    if (this._redisClient && this._redisClient.isOpen) {
      await this._redisClient.disconnect();
      console.log('✅ Previous Redis disconnected');
    }

    // Create new Redis client
    this._redisClient = rd.createClient({ url: redisUrl });
    this._redisClient.on('error', (err: Error) => console.error('❌ Redis Error:', err));

    // Connect to new Redis
    await this._redisClient.connect();
    console.log('✅ New Redis connected');
  }

  /**
   * Change Prisma connection
   */
  public async changePrismaConnection(databaseUrl: string): Promise<void> {
    console.log('🔄 Changing Prisma connection...');

    // Disconnect existing Prisma client if connected
    if (this._prisma) {
      await this._prisma.$disconnect();
      this._prisma = null;
      console.log('✅ Previous Prisma disconnected');
    }

    // Create new Prisma client with new database URL
    this._prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });

    // Connect to new database
    await this._prisma.$connect();
    console.log('✅ New Prisma connected');
  }

  /**
   * Reconnect to both databases
   */
  public async reconnect(): Promise<void> {
    console.log('🔄 Reconnecting to databases...');

    this._isConnected = false;
    await this.disconnect();
    await this.connect();

    console.log('🚀 Reconnection complete');
  }

  /**
   * Test connection to both databases
   */
  public async testConnections(): Promise<{ prisma: boolean; redis: boolean }> {
    console.log('🧪 Testing connections...');

    const results = await this.healthCheck();

    console.log('🧪 Connection test results:', results);
    return results;
  }

  /**
   * Switch database connection using database service
   */
  public async switchDatabaseConnection(
    connectionName?: string,
    connectionId?: string,
  ): Promise<void> {
    try {
      console.log('🔄 Switching database connection via database service...');

      // Import database connection service dynamically
      const { databaseConnectionService } = await import('./services/database-connection.service');

      let connection;

      if (connectionId) {
        // Find connection by ID
        connection = await databaseConnectionService.findById(connectionId);
      } else if (connectionName) {
        // Find connection by name
        const connections = await databaseConnectionService.findAll();
        connection = connections.find((conn: any) => conn.name === connectionName);
      } else {
        // Get default active connection
        const connections = await databaseConnectionService.findAll();
        connection = connections.find((conn: any) => conn.isActive);
      }

      if (!connection) {
        throw new Error(
          `Database connection not found: ${connectionName || connectionId || 'active'}`,
        );
      }

      // Build database URL from connection data
      const { type, host, port, database, username, password } = connection;
      const databaseUrl = `${type}://${username}:${password}@${host}:${port}/${database}`;

      // Switch to the new database connection
      await this.changePrismaConnection(databaseUrl);

      console.log(`✅ Successfully switched to database connection: ${connection.name}`);
    } catch (error) {
      console.error('❌ Failed to switch database connection:', error);
      throw error;
    }
  }

  /**
   * Switch Redis connection using database connection service
   */
  public async switchRedisConnection(
    connectionName?: string,
    connectionId?: string,
  ): Promise<void> {
    try {
      console.log('🔄 Switching Redis connection via database connection service...');

      // Import database connection service dynamically
      const { databaseConnectionService } = await import('./services/database-connection.service');

      let connection;

      if (connectionId) {
        // Find Redis connection by ID
        connection = await databaseConnectionService.findById(connectionId);
      } else if (connectionName) {
        // Find Redis connection by name
        const connections = await databaseConnectionService.findAll();
        connection = connections.find(
          (conn: any) => conn.name === connectionName && conn.type === 'redis',
        );
      } else {
        // Get default active Redis connection
        const connections = await databaseConnectionService.findAll();
        connection = connections.find((conn: any) => conn.isActive && conn.type === 'redis');
      }

      if (!connection) {
        throw new Error(
          `Redis connection not found: ${connectionName || connectionId || 'active'}`,
        );
      }

      // Build Redis URL from connection data
      const { host, port, password } = connection;
      let redisUrl = `redis://${host}:${port}`;

      if (password) {
        redisUrl = `redis://:${password}@${host}:${port}`;
      }

      // Switch to the new Redis connection
      await this.changeRedisConnection(redisUrl);

      console.log(`✅ Successfully switched to Redis connection: ${connection.name}`);
    } catch (error) {
      console.error('❌ Failed to switch Redis connection:', error);
      throw error;
    }
  }

  /**
   * List available database connections
   */
  public async listDatabaseConnections(): Promise<any[]> {
    try {
      const { databaseConnectionService } = await import('./services/database-connection.service');
      const connections = await databaseConnectionService.findAll();

      return connections.map((conn: any) => ({
        id: conn.id,
        name: conn.name,
        type: conn.type,
        host: conn.host,
        port: conn.port,
        database: conn.database,
        isActive: conn.isActive,
        description: conn.description,
      }));
    } catch (error) {
      console.error('❌ Failed to list database connections:', error);
      throw error;
    }
  }

  /**
   * Get current active connections
   */
  public async getActiveConnections(): Promise<{ database?: any; redis?: any }> {
    try {
      const { databaseConnectionService } = await import('./services/database-connection.service');
      const connections = await databaseConnectionService.findAll();

      const activeDatabase = connections.find(
        (conn: any) =>
          conn.isActive && ['mysql', 'postgresql', 'mongodb', 'sqlite'].includes(conn.type),
      );

      const activeRedis = connections.find((conn: any) => conn.isActive && conn.type === 'redis');

      return {
        database: activeDatabase
          ? {
              id: activeDatabase.id,
              name: activeDatabase.name,
              type: activeDatabase.type,
              host: activeDatabase.host,
              port: activeDatabase.port,
              database: activeDatabase.database,
            }
          : undefined,
        redis: activeRedis
          ? {
              id: activeRedis.id,
              name: activeRedis.name,
              host: activeRedis.host,
              port: activeRedis.port,
            }
          : undefined,
      };
    } catch (error) {
      console.error('❌ Failed to get active connections:', error);
      throw error;
    }
  }

  /**
   * Switch to environment-specific connections
   */
  public async switchToEnvironment(
    environment: 'development' | 'staging' | 'production',
  ): Promise<void> {
    try {
      console.log(`🔄 Switching to ${environment} environment connections...`);

      // Switch database connection for environment
      try {
        await this.switchDatabaseConnection(`${environment}-db`);
      } catch (error) {
        console.warn(`⚠️ No ${environment} database connection found, keeping current`);
      }

      // Switch Redis connection for environment
      try {
        await this.switchRedisConnection(`${environment}-redis`);
      } catch (error) {
        console.warn(`⚠️ No ${environment} Redis connection found, keeping current`);
      }

      // Test the new connections
      const health = await this.testConnections();

      if (health.prisma && health.redis) {
        console.log(`✅ Successfully switched to ${environment} environment`);
      } else {
        console.warn(`⚠️ Some connections failed in ${environment} environment`);
      }
    } catch (error) {
      console.error(`❌ Failed to switch to ${environment} environment:`, error);
      throw error;
    }
  }

  /**
   * Switch to backup connections (for failover)
   */
  public async switchToBackupConnections(): Promise<void> {
    try {
      console.log('🔄 Switching to backup connections...');

      // Switch to backup database
      try {
        await this.switchDatabaseConnection('backup-db');
      } catch (error) {
        console.warn('⚠️ No backup database connection found');
      }

      // Switch to backup Redis
      try {
        await this.switchRedisConnection('backup-redis');
      } catch (error) {
        console.warn('⚠️ No backup Redis connection found');
      }

      const health = await this.testConnections();

      if (health.prisma && health.redis) {
        console.log('✅ Successfully switched to backup connections');
      } else {
        console.warn('⚠️ Some backup connections failed');
      }
    } catch (error) {
      console.error('❌ Failed to switch to backup connections:', error);
      throw error;
    }
  }

  /**
   * Setup graceful shutdown
   */
  public setupGracefulShutdown(): void {
    process.on('SIGINT', async () => {
      console.log('🛑 Shutting down...');
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('🛑 Shutting down...');
      await this.disconnect();
      process.exit(0);
    });

    console.log('🛡️ Shutdown handlers ready');
  }
}

// Export singleton instance
export const setup = new Setup();

setup.connect().then(async () => {
  await setup.setupGracefulShutdown();
  await checkRedisConnection(setup.redis);
});

export const prisma = setup.prisma;
export const client = setup.redis;
