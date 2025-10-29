import { PrismaClient } from '@prisma/client';
import * as rd from 'redis';
import { REDIS_URL } from './env';
import { checkRedisConnection } from './utils/validationUtils';
import { databaseConnectionService } from './services/database-connection.service';

type RedisClient = ReturnType<typeof rd.createClient>;
        
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
  
  // Multi-connection storage
  private _multiPrismaConnections: Map<string, PrismaClient> = new Map();
  private _multiRedisConnections: Map<string, RedisClient> = new Map();
  private _activePrismaConnection: string = 'default';
  private _activeRedisConnection: string = 'default';

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

      let connection;

      if (connectionId) {
        // Find connection by ID
        connection = await this.databaseConnectionService.findById(connectionId);
      } else if (connectionName) {
        // Find connection by name
        const connections = await this.databaseConnectionService.findAll();
        connection = connections.find((conn: any) => conn.name === connectionName);
      } else {
        // Get default active connection
        const connections = await this.databaseConnectionService.findAll();
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
      let connection;

      if (connectionId) {
        // Find Redis connection by ID
        connection = await this.databaseConnectionService.findById(connectionId);
      } else if (connectionName) {
        // Find Redis connection by name
        const connections = await this.databaseConnectionService.findAll();
        connection = connections.find(
          (conn: any) => conn.name === connectionName && conn.type === 'redis',
        );
      } else {
        // Get default active Redis connection
        const connections = await this.databaseConnectionService.findAll();
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
      const connections = await this.databaseConnectionService.findAll();

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
      const connections = await this.databaseConnectionService.findAll();

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
   * Create multiple database connections
   */
  public async createMultipleDatabaseConnections(connections: Array<{
    name: string;
    databaseUrl: string;
    setAsActive?: boolean;
  }>): Promise<void> {
    console.log(`🔌 Creating ${connections.length} database connections...`);
    
    for (const conn of connections) {
      try {
        const prismaClient = new PrismaClient({
          datasources: {
            db: {
              url: conn.databaseUrl
            }
          },
          log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        });
        
        await prismaClient.$connect();
        this._multiPrismaConnections.set(conn.name, prismaClient);
        
        if (conn.setAsActive || conn.name === 'default') {
          this._activePrismaConnection = conn.name;
          this._prisma = prismaClient;
        }
        
        console.log(`✅ Database connection '${conn.name}' created successfully`);
      } catch (error) {
        console.error(`❌ Failed to create database connection '${conn.name}':`, error);
        throw error;
      }
    }
    
    console.log(`🚀 All database connections created. Active: ${this._activePrismaConnection}`);
  }

  /**
   * Create multiple Redis connections
   */
  public async createMultipleRedisConnections(connections: Array<{
    name: string;
    redisUrl: string;
    setAsActive?: boolean;
  }>): Promise<void> {
    console.log(`🔌 Creating ${connections.length} Redis connections...`);
    
    for (const conn of connections) {
      try {
        const redisClient = rd.createClient({ url: conn.redisUrl });
        redisClient.on('error', (err: Error) => 
          console.error(`❌ Redis Error (${conn.name}):`, err)
        );
        
        await redisClient.connect();
        this._multiRedisConnections.set(conn.name, redisClient);
        
        if (conn.setAsActive || conn.name === 'default') {
          this._activeRedisConnection = conn.name;
          this._redisClient = redisClient;
        }
        
        console.log(`✅ Redis connection '${conn.name}' created successfully`);
      } catch (error) {
        console.error(`❌ Failed to create Redis connection '${conn.name}':`, error);
        throw error;
      }
    }
    
    console.log(`🚀 All Redis connections created. Active: ${this._activeRedisConnection}`);
  }

  /**
   * Switch active database connection
   */
  public switchActiveDatabaseConnection(connectionName: string): void {
    const connection = this._multiPrismaConnections.get(connectionName);
    if (!connection) {
      throw new Error(`Database connection '${connectionName}' not found`);
    }
    
    this._activePrismaConnection = connectionName;
    this._prisma = connection;
    console.log(`🔄 Switched active database connection to: ${connectionName}`);
  }

  /**
   * Switch active Redis connection
   */
  public switchActiveRedisConnection(connectionName: string): void {
    const connection = this._multiRedisConnections.get(connectionName);
    if (!connection) {
      throw new Error(`Redis connection '${connectionName}' not found`);
    }
    
    this._activeRedisConnection = connectionName;
    this._redisClient = connection;
    console.log(`🔄 Switched active Redis connection to: ${connectionName}`);
  }

  /**
   * Get specific database connection
   */
  public getDatabaseConnection(connectionName: string): PrismaClient {
    const connection = this._multiPrismaConnections.get(connectionName);
    if (!connection) {
      throw new Error(`Database connection '${connectionName}' not found`);
    }
    return connection;
  }

  /**
   * Get specific Redis connection
   */
  public getRedisConnection(connectionName: string): RedisClient {
    const connection = this._multiRedisConnections.get(connectionName);
    if (!connection) {
      throw new Error(`Redis connection '${connectionName}' not found`);
    }
    return connection;
  }

  /**
   * List all active connections
   */
  public listAllConnections(): {
    databases: Array<{ name: string; isActive: boolean }>;
    redis: Array<{ name: string; isActive: boolean }>;
  } {
    return {
      databases: Array.from(this._multiPrismaConnections.keys()).map((name: string) => ({
        name,
        isActive: name === this._activePrismaConnection
      })),
      redis: Array.from(this._multiRedisConnections.keys()).map((name: string) => ({
        name,
        isActive: name === this._activeRedisConnection
      }))
    };
  }

  /**
   * Test specific connection
   */
  public async testSpecificConnections(connectionNames?: {
    database?: string;
    redis?: string;
  }): Promise<{ prisma: boolean; redis: boolean; details: { database?: string; redis?: string } }> {
    const results = { prisma: false, redis: false, details: {} as { database?: string; redis?: string } };
    
    // Test specific database connection
    if (connectionNames?.database) {
      try {
        const dbConnection = this.getDatabaseConnection(connectionNames.database);
        await dbConnection.$queryRaw`SELECT 1`;
        results.prisma = true;
        results.details.database = `Connection '${connectionNames.database}' is healthy`;
      } catch (error) {
        results.details.database = `Connection '${connectionNames.database}' failed: ${error}`;
      }
    }
    
    // Test specific Redis connection
    if (connectionNames?.redis) {
      try {
        const redisConnection = this.getRedisConnection(connectionNames.redis);
        if (redisConnection.isOpen) {
          await redisConnection.ping();
          results.redis = true;
          results.details.redis = `Connection '${connectionNames.redis}' is healthy`;
        }
      } catch (error) {
        results.details.redis = `Connection '${connectionNames.redis}' failed: ${error}`;
      }
    }
    
    return results;
  }

  /**
   * Test all connections
   */
  public async testAllConnections(): Promise<{
    databases: Record<string, boolean>;
    redis: Record<string, boolean>;
    summary: { totalDatabases: number; healthyDatabases: number; totalRedis: number; healthyRedis: number };
  }> {
    const results = {
      databases: {} as Record<string, boolean>,
      redis: {} as Record<string, boolean>,
      summary: { totalDatabases: 0, healthyDatabases: 0, totalRedis: 0, healthyRedis: 0 }
    };
    
    // Test all database connections
    for (const [name, connection] of this._multiPrismaConnections) {
      results.summary.totalDatabases++;
      try {
        await connection.$queryRaw`SELECT 1`;
        results.databases[name] = true;
        results.summary.healthyDatabases++;
      } catch {
        results.databases[name] = false;
      }
    }
    
    // Test all Redis connections
    for (const [name, connection] of this._multiRedisConnections) {
      results.summary.totalRedis++;
      try {
        if (connection.isOpen) {
          await connection.ping();
          results.redis[name] = true;
          results.summary.healthyRedis++;
        } else {
          results.redis[name] = false;
        }
      } catch {
        results.redis[name] = false;
      }
    }
    
    return results;
  }

  /**
   * Remove specific connection
   */
  public async removeConnection(type: 'database' | 'redis', connectionName: string): Promise<void> {
    if (type === 'database') {
      const connection = this._multiPrismaConnections.get(connectionName);
      if (connection) {
        await connection.$disconnect();
        this._multiPrismaConnections.delete(connectionName);
        
        // If this was the active connection, switch to another or clear
        if (this._activePrismaConnection === connectionName) {
          const remainingConnections = Array.from(this._multiPrismaConnections.keys()) as string[];
          if (remainingConnections.length > 0) {
            this.switchActiveDatabaseConnection(remainingConnections[0]);
          } else {
            this._prisma = null;
            this._activePrismaConnection = '';
          }
        }
        
        console.log(`✅ Database connection '${connectionName}' removed`);
      }
    } else {
      const connection = this._multiRedisConnections.get(connectionName);
      if (connection) {
        await connection.disconnect();
        this._multiRedisConnections.delete(connectionName);
        
        // If this was the active connection, switch to another or clear
        if (this._activeRedisConnection === connectionName) {
          const remainingConnections = Array.from(this._multiRedisConnections.keys()) as string[];
          if (remainingConnections.length > 0) {
            this.switchActiveRedisConnection(remainingConnections[0]);
          } else {
            this._redisClient = null;
            this._activeRedisConnection = '';
          }
        }
        
        console.log(`✅ Redis connection '${connectionName}' removed`);
      }
    }
  }

  /**
   * Disconnect all connections
   */
  public async disconnectAllConnections(): Promise<void> {
    console.log('🔌 Disconnecting all connections...');
    
    // Disconnect all database connections
    for (const [name, connection] of this._multiPrismaConnections) {
      try {
        await connection.$disconnect();
        console.log(`✅ Database '${name}' disconnected`);
      } catch (error) {
        console.error(`❌ Failed to disconnect database '${name}':`, error);
      }
    }
    this._multiPrismaConnections.clear();
    
    // Disconnect all Redis connections
    for (const [name, connection] of this._multiRedisConnections) {
      try {
        await connection.disconnect();
        console.log(`✅ Redis '${name}' disconnected`);
      } catch (error) {
        console.error(`❌ Failed to disconnect Redis '${name}':`, error);
      }
    }
    this._multiRedisConnections.clear();
    
    // Clear single connections
    await this.disconnect();
    
    console.log('👋 All connections disconnected');
  }

  /**
   * Setup graceful shutdown
   */
  public setupGracefulShutdown(): void {
    process.on('SIGINT', async () => {
      console.log('🛑 Shutting down...');
      await this.disconnectAllConnections();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('🛑 Shutting down...');
      await this.disconnectAllConnections();
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
