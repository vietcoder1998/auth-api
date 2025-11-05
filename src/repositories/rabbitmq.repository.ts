import amqp, { Channel, Connection, ConsumeMessage } from 'amqplib';
import { logger } from '../middlewares/logger.middle';

export interface RabbitMQConfig {
  url: string;
  queues: {
    [key: string]: {
      name: string;
      durable?: boolean;
      exclusive?: boolean;
      autoDelete?: boolean;
      arguments?: any;
    };
  };
}

export class RabbitMQRepository {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private config: RabbitMQConfig;
  private readonly queueNames: Record<string, string> = {
    execute_tool: 'execute_tool',
    generate_prompt: 'generate_prompt',
    backup: 'backup',
  };

  constructor(config?: RabbitMQConfig) {
    this.config = config || {
      url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
      queues: {
        execute_tool: {
          name: 'execute_tool',
          durable: true,
          exclusive: false,
          autoDelete: false,
        },
        generate_prompt: {
          name: 'generate_prompt',
          durable: true,
          exclusive: false,
          autoDelete: false,
        },
        backup: {
          name: 'backup',
          durable: true,
          exclusive: false,
          autoDelete: false,
        },
      },
    };
  }

  /**
   * Connect to RabbitMQ server
   */
  async connect(): Promise<void> {
    try {
      if (this.connection) {
        logger.info('RabbitMQ connection already exists');
        return;
      }

      logger.info(`Connecting to RabbitMQ at ${this.config.url}`);
      this.connection = await amqp.connect(this.config.url);

      this.connection.on('error', (err) => {
        logger.error('RabbitMQ connection error:', err);
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.connection = null;
        this.channel = null;
      });

      logger.info('Successfully connected to RabbitMQ');

      // Create channel and assert queues
      await this.createChannel();
      await this.assertQueues();
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  /**
   * Create a channel
   */
  private async createChannel(): Promise<Channel> {
    try {
      if (!this.connection) {
        throw new Error('RabbitMQ connection not established');
      }

      if (this.channel) {
        return this.channel;
      }

      this.channel = await this.connection.createChannel();

      this.channel.on('error', (err) => {
        logger.error('RabbitMQ channel error:', err);
      });

      this.channel.on('close', () => {
        logger.warn('RabbitMQ channel closed');
        this.channel = null;
      });

      // Set prefetch to control concurrent message processing
      await this.channel.prefetch(1);

      logger.info('RabbitMQ channel created successfully');
      return this.channel;
    } catch (error) {
      logger.error('Failed to create RabbitMQ channel:', error);
      throw error;
    }
  }

  /**
   * Assert all configured queues
   */
  private async assertQueues(): Promise<void> {
    try {
      if (!this.channel) {
        throw new Error('Channel not available');
      }

      for (const [queueKey, queueConfig] of Object.entries(this.config.queues)) {
        await this.channel.assertQueue(queueConfig.name, {
          durable: queueConfig.durable !== false,
          exclusive: queueConfig.exclusive || false,
          autoDelete: queueConfig.autoDelete || false,
          arguments: queueConfig.arguments || {},
        });

        logger.info(`Queue asserted: ${queueConfig.name}`);
      }
    } catch (error) {
      logger.error('Failed to assert queues:', error);
      throw error;
    }
  }

  /**
   * Get the channel instance
   */
  async getChannel(): Promise<Channel> {
    if (!this.channel) {
      await this.createChannel();
    }

    if (!this.channel) {
      throw new Error('Failed to get RabbitMQ channel');
    }

    return this.channel;
  }

  /**
   * Get queue name by key
   */
  getQueueName(queueKey: string): string {
    const queueConfig = this.config.queues[queueKey];
    if (!queueConfig) {
      logger.warn(`Queue key "${queueKey}" not found in config, using key as queue name`);
      return queueKey;
    }
    return queueConfig.name;
  }

  /**
   * Publish a message to a queue
   */
  async publishToQueue(
    queueKey: string,
    message: any,
    options?: {
      persistent?: boolean;
      priority?: number;
      expiration?: string;
      headers?: any;
    }
  ): Promise<boolean> {
    try {
      const channel = await this.getChannel();
      const queueName = this.getQueueName(queueKey);

      const messageBuffer = Buffer.from(JSON.stringify(message));
      
      const sent = channel.sendToQueue(queueName, messageBuffer, {
        persistent: options?.persistent !== false,
        priority: options?.priority || 0,
        expiration: options?.expiration,
        headers: options?.headers,
      });

      if (sent) {
        logger.info(`Message published to queue "${queueName}"`);
      } else {
        logger.warn(`Failed to publish message to queue "${queueName}" - buffer full`);
      }

      return sent;
    } catch (error) {
      logger.error(`Error publishing to queue "${queueKey}":`, error);
      throw error;
    }
  }

  /**
   * Consume messages from a queue
   */
  async consume(
    queueKey: string,
    onMessage: (message: ConsumeMessage | null) => void | Promise<void>,
    options?: {
      noAck?: boolean;
      exclusive?: boolean;
      priority?: number;
      arguments?: any;
    }
  ): Promise<string> {
    try {
      const channel = await this.getChannel();
      const queueName = this.getQueueName(queueKey);

      const { consumerTag } = await channel.consume(
        queueName,
        onMessage,
        {
          noAck: options?.noAck || false,
          exclusive: options?.exclusive || false,
          priority: options?.priority,
          arguments: options?.arguments,
        }
      );

      logger.info(`Started consuming from queue "${queueName}" with tag: ${consumerTag}`);
      return consumerTag;
    } catch (error) {
      logger.error(`Error consuming from queue "${queueKey}":`, error);
      throw error;
    }
  }

  /**
   * Acknowledge a message
   */
  async ack(message: ConsumeMessage, allUpTo?: boolean): Promise<void> {
    try {
      const channel = await this.getChannel();
      channel.ack(message, allUpTo);
    } catch (error) {
      logger.error('Error acknowledging message:', error);
      throw error;
    }
  }

  /**
   * Reject a message
   */
  async nack(message: ConsumeMessage, allUpTo?: boolean, requeue?: boolean): Promise<void> {
    try {
      const channel = await this.getChannel();
      channel.nack(message, allUpTo, requeue);
    } catch (error) {
      logger.error('Error rejecting message:', error);
      throw error;
    }
  }

  /**
   * Get queue message count
   */
  async getQueueMessageCount(queueKey: string): Promise<number> {
    try {
      const channel = await this.getChannel();
      const queueName = this.getQueueName(queueKey);
      const queueInfo = await channel.checkQueue(queueName);
      return queueInfo.messageCount;
    } catch (error) {
      logger.error(`Error getting message count for queue "${queueKey}":`, error);
      throw error;
    }
  }

  /**
   * Purge all messages from a queue
   */
  async purgeQueue(queueKey: string): Promise<number> {
    try {
      const channel = await this.getChannel();
      const queueName = this.getQueueName(queueKey);
      const result = await channel.purgeQueue(queueName);
      logger.info(`Purged ${result.messageCount} messages from queue "${queueName}"`);
      return result.messageCount;
    } catch (error) {
      logger.error(`Error purging queue "${queueKey}":`, error);
      throw error;
    }
  }

  /**
   * Delete a queue
   */
  async deleteQueue(queueKey: string, options?: { ifUnused?: boolean; ifEmpty?: boolean }): Promise<number> {
    try {
      const channel = await this.getChannel();
      const queueName = this.getQueueName(queueKey);
      const result = await channel.deleteQueue(queueName, {
        ifUnused: options?.ifUnused || false,
        ifEmpty: options?.ifEmpty || false,
      });
      logger.info(`Deleted queue "${queueName}" with ${result.messageCount} messages`);
      return result.messageCount;
    } catch (error) {
      logger.error(`Error deleting queue "${queueKey}":`, error);
      throw error;
    }
  }

  /**
   * Disconnect from RabbitMQ
   */
  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
        logger.info('RabbitMQ channel closed');
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = null;
        logger.info('RabbitMQ connection closed');
      }
    } catch (error) {
      logger.error('Error disconnecting from RabbitMQ:', error);
      throw error;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }
}