import { PrismaClient } from '@prisma/client';
import * as rd from 'redis';
import { REDIS_URL } from './env';
import { checkRedisConnection } from './utils/validationUtils';

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
    this._redisClient.on('error', (err: Error) =>
      console.error('❌ Redis Error:', err)
    );

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
          url: databaseUrl
        }
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
