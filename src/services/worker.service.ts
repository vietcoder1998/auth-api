import { RabbitMQRepository } from '../repositories/rabbitmq.repository';
import { JobRepository } from '../repositories/job.repository';
import { logger } from '../middlewares/logger.middle';

// Type definitions from the diagram
export interface JobExecuteToolProcessDto {
  jobId: string;
  toolName: string;
  parameters: Record<string, any>;
  agentId?: string;
  conversationId?: string;
}

export interface JobExecuteToolResultDto {
  jobId: string;
  success: boolean;
  result: any;
  error?: string;
  processingTime: number;
}

export interface JobGeneratePromptDto {
  jobId: string;
  prompt: string;
  agentId: string;
  conversationId?: string;
  context?: Record<string, any>;
}

export interface JobGeneratePromptResultDto {
  jobId: string;
  success: boolean;
  generatedPrompt: string;
  error?: string;
  processingTime: number;
}

export interface JobBackupProcessDto {
  jobId: string;
  backupType: 'full' | 'incremental' | 'differential';
  entities: string[];
  destination?: string;
}

export interface JobBackupProcessResultDto {
  jobId: string;
  success: boolean;
  backupPath?: string;
  error?: string;
  processingTime: number;
}

export class WorkerService {
  private readonly rabbitMQRepository: RabbitMQRepository;
  private readonly jobRepository: JobRepository;

  constructor(
    rabbitMQRepository: RabbitMQRepository,
    jobRepository: JobRepository
  ) {
    this.rabbitMQRepository = rabbitMQRepository;
    this.jobRepository = jobRepository;
  }

  /**
   * Listen to RabbitMQ queues and process messages
   */
  private async listenOnMq(): Promise<void> {
    try {
      const channel = await this.rabbitMQRepository.getChannel();
      
      // Listen to execute_tool queue
      await channel.consume(
        this.rabbitMQRepository.getQueueName('execute_tool'),
        async (msg) => {
          if (msg) {
            try {
              const data: JobExecuteToolProcessDto = JSON.parse(msg.content.toString());
              await this.startJobExecuteToolProcess(data);
              channel.ack(msg);
            } catch (error) {
              logger.error('Error processing execute_tool message:', error);
              channel.nack(msg, false, false);
            }
          }
        }
      );

      // Listen to generate_prompt queue
      await channel.consume(
        this.rabbitMQRepository.getQueueName('generate_prompt'),
        async (msg) => {
          if (msg) {
            try {
              const data: JobGeneratePromptDto = JSON.parse(msg.content.toString());
              await this.startGeneratePromptProcess(data);
              channel.ack(msg);
            } catch (error) {
              logger.error('Error processing generate_prompt message:', error);
              channel.nack(msg, false, false);
            }
          }
        }
      );

      // Listen to backup queue
      await channel.consume(
        this.rabbitMQRepository.getQueueName('backup'),
        async (msg) => {
          if (msg) {
            try {
              const data: JobBackupProcessDto = JSON.parse(msg.content.toString());
              await this.startBackupProcess(data);
              channel.ack(msg);
            } catch (error) {
              logger.error('Error processing backup message:', error);
              channel.nack(msg, false, false);
            }
          }
        }
      );

      logger.info('Worker service listening to RabbitMQ queues');
    } catch (error) {
      logger.error('Error setting up RabbitMQ listeners:', error);
      throw error;
    }
  }

  /**
   * Fork a new process to handle job execution (from diagram)
   */
  private forkProcess(): void {
    // Implementation would use Node.js child_process.fork()
    // This is a placeholder for the actual implementation
    logger.info('Forking new process for job execution');
  }

  /**
   * Fork a new job process with specific job ID
   * @param jobId - The job ID to process
   * @returns Promise that resolves when job is queued
   */
  private async forkNewJobProcessWithJob<T>(jobId: string): Promise<T> {
    try {
      // Get job details from repository
      const job = await this.jobRepository.findById(jobId);
      
      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }

      // Fork process to handle the job
      this.forkProcess();

      return job as T;
    } catch (error) {
      logger.error(`Error forking process for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Start job execution for tool processing
   * @param jobExecuteToolProcessDto - The tool execution job data
   * @returns Promise with job result
   */
  private async startJobExecuteToolProcess(
    jobExecuteToolProcessDto: JobExecuteToolProcessDto
  ): Promise<JobExecuteToolResultDto> {
    const startTime = Date.now();
    
    try {
      logger.info(`Starting tool execution job: ${jobExecuteToolProcessDto.jobId}`);
      
      // Create job record
      await this.jobRepository.create({
        id: jobExecuteToolProcessDto.jobId,
        type: 'execute_tool',
        status: 'processing',
        data: jobExecuteToolProcessDto,
      });

      // Fork process to handle execution
      await this.forkNewJobProcessWithJob(jobExecuteToolProcessDto.jobId);

      // Simulate tool execution (replace with actual implementation)
      const result = {
        jobId: jobExecuteToolProcessDto.jobId,
        success: true,
        result: { message: 'Tool executed successfully' },
        processingTime: Date.now() - startTime,
      };

      // Update job status
      await this.jobRepository.update(jobExecuteToolProcessDto.jobId, {
        status: 'completed',
        result,
      });

      return result;
    } catch (error) {
      logger.error('Error in tool execution job:', error);
      
      const errorResult = {
        jobId: jobExecuteToolProcessDto.jobId,
        success: false,
        result: null,
        error: error instanceof Error ? error.message : String(error),
        processingTime: Date.now() - startTime,
      };

      await this.jobRepository.update(jobExecuteToolProcessDto.jobId, {
        status: 'failed',
        result: errorResult,
      });

      return errorResult;
    }
  }

  /**
   * Start job for generating prompts
   * @param jobGeneratePromptDto - The prompt generation job data
   * @returns Promise with generated prompt result
   */
  private async startGeneratePromptProcess(
    jobGeneratePromptDto: JobGeneratePromptDto
  ): Promise<JobGeneratePromptResultDto> {
    const startTime = Date.now();
    
    try {
      logger.info(`Starting prompt generation job: ${jobGeneratePromptDto.jobId}`);
      
      // Create job record
      await this.jobRepository.create({
        id: jobGeneratePromptDto.jobId,
        type: 'generate_prompt',
        status: 'processing',
        data: jobGeneratePromptDto,
      });

      // Fork process to handle generation
      await this.forkNewJobProcessWithJob(jobGeneratePromptDto.jobId);

      // Simulate prompt generation (replace with actual LLM service call)
      const generatedPrompt = `Generated prompt based on: ${jobGeneratePromptDto.prompt}`;

      const result = {
        jobId: jobGeneratePromptDto.jobId,
        success: true,
        generatedPrompt,
        processingTime: Date.now() - startTime,
      };

      await this.jobRepository.update(jobGeneratePromptDto.jobId, {
        status: 'completed',
        result,
      });

      return result;
    } catch (error) {
      logger.error('Error in prompt generation job:', error);
      
      const errorResult = {
        jobId: jobGeneratePromptDto.jobId,
        success: false,
        generatedPrompt: '',
        error: error instanceof Error ? error.message : String(error),
        processingTime: Date.now() - startTime,
      };

      await this.jobRepository.update(jobGeneratePromptDto.jobId, {
        status: 'failed',
        result: errorResult,
      });

      return errorResult;
    }
  }

  /**
   * Start backup process job
   * @param jobBackupProcessDto - The backup job data
   * @returns Promise with backup result
   */
  private async startBackupProcess(
    jobBackupProcessDto: JobBackupProcessDto
  ): Promise<JobBackupProcessResultDto> {
    const startTime = Date.now();
    
    try {
      logger.info(`Starting backup job: ${jobBackupProcessDto.jobId}`);
      
      // Create job record
      await this.jobRepository.create({
        id: jobBackupProcessDto.jobId,
        type: 'backup',
        status: 'processing',
        data: jobBackupProcessDto,
      });

      // Fork process to handle backup
      await this.forkNewJobProcessWithJob(jobBackupProcessDto.jobId);

      // Simulate backup (replace with actual backup implementation)
      const backupPath = `/backups/${jobBackupProcessDto.backupType}/${Date.now()}`;

      const result = {
        jobId: jobBackupProcessDto.jobId,
        success: true,
        backupPath,
        processingTime: Date.now() - startTime,
      };

      await this.jobRepository.update(jobBackupProcessDto.jobId, {
        status: 'completed',
        result,
      });

      return result;
    } catch (error) {
      logger.error('Error in backup job:', error);
      
      const errorResult = {
        jobId: jobBackupProcessDto.jobId,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        processingTime: Date.now() - startTime,
      };

      await this.jobRepository.update(jobBackupProcessDto.jobId, {
        status: 'failed',
        result: errorResult,
      });

      return errorResult;
    }
  }

  /**
   * Initialize the worker service and start listening to queues
   */
  public async start(): Promise<void> {
    try {
      await this.rabbitMQRepository.connect();
      await this.listenOnMq();
      logger.info('Worker service started successfully');
    } catch (error) {
      logger.error('Failed to start worker service:', error);
      throw error;
    }
  }

  /**
   * Stop the worker service and close connections
   */
  public async stop(): Promise<void> {
    try {
      await this.rabbitMQRepository.disconnect();
      logger.info('Worker service stopped');
    } catch (error) {
      logger.error('Error stopping worker service:', error);
      throw error;
    }
  }
}