import {
  AgentMemoryDro,
  AgentMemoryDto,
  AgentMemoryModel,
} from '../interfaces/agentmemory.interface';
import {
  AgentMemoryRepository,
  agentMemoryRepository,
} from '../repositories/agentmemory.repository';
import { BaseService } from './base.service';
import { LLMService, llmService } from './llm.service';
import { vectorService } from './vector.service';

export class MemoryService extends BaseService<AgentMemoryModel, AgentMemoryDto, AgentMemoryDro> {
  private agentMemoryRepository: AgentMemoryRepository;
  private llmService: LLMService = llmService;

  constructor() {
    super(agentMemoryRepository);
    this.agentMemoryRepository = agentMemoryRepository;
  }

  get memoryRepository() {
    return this.repository;
  }
  /**
   * Create a memory and save its embedding to Redis vector DB.
   * Overrides BaseService create to handle memory-specific logic
   */
  override async create(memoryData: any): Promise<AgentMemoryDro> {
    // Validate input data
    if (!memoryData) {
      throw new Error('Memory data is required');
    }

    // Validate required fields
    if (!memoryData.type) {
      throw new Error('Memory type is required');
    }

    // Validate type value
    const validTypes = ['user', 'assistant', 'system', 'function'];
    if (!validTypes.includes(memoryData.type)) {
      throw new Error(`Invalid memory type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate agentId for user type
    if (!memoryData.agentId) {
      throw new Error('agentId is required for user type memories');
    }

    // Validate content exists
    if (!memoryData?.content) {
      throw new Error('Memory content is required');
    }

    // If type is 'long_term', call LLMService to generate a prompt
    if (memoryData.type === 'long_term') {
      // Prepare prompt message
      const agentId = memoryData.agentId;
      const promptMessage =
        typeof memoryData.content === 'string'
          ? memoryData.content
          : JSON.stringify(memoryData.content);

      // Call LLMService to generate response
      const llmResponse = await this.llmService.generateResponse(
        [{ role: 'user', content: promptMessage }],
        {
          agentId,
          modelType: memoryData.modelType || 'gpt',
        },
      );

      // Validate LLM response
      if (!llmResponse || !llmResponse.content) {
        throw new Error('Failed to generate LLM response for user memory');
      }

      // Save the generated prompt as content
      memoryData.content = llmResponse.content;
    }

    if (memoryData.content) {
      // Ensure content is a string for Prisma
      if (typeof memoryData.content === 'object') {
        memoryData.content = JSON.stringify(memoryData.content);
      }

      try {
        const vector = await vectorService.saveMessage(memoryData.content);
        if (vector && vector.vectorId) {
          memoryData.vectorId = vector.vectorId;
        }
      } catch (error) {
        throw new Error(
          `Vector service error: ${error instanceof Error ? error.message : 'Failed to save vector'}`,
        );
      }
    }
    delete memoryData.embedding; // Remove legacy field if present

    // Fix: Use connect for agent and conversation relations
    // Remove messageId if present, as it's not a valid field
    const { agentId, conversationId, messageId, content, ...rest } = memoryData;

    // Validate content after processing
    if (!content && content !== '') {
      throw new Error('Processed content cannot be null or undefined');
    }

    const processedData: any = {
      ...rest,
      content: typeof content === 'string' ? content : '',
      agent: agentId ? { connect: { id: agentId } } : undefined,
      conversation: conversationId ? { connect: { id: conversationId } } : undefined,
    };

    // If messageId is present, use the message relation
    if (messageId) {
      processedData.message = { connect: { id: messageId } };
    }

    // Validate at least one relation exists
    if (!processedData.agent && !processedData.conversation && !processedData.message) {
      throw new Error(
        'Memory must be associated with at least one of: agent, conversation, or message',
      );
    }
    const newMemory = await this.memoryRepository.create<typeof processedData, AgentMemoryDro>(
      processedData,
    );

    return newMemory;
  }

  /**
   * Get all memories, with vector info from Redis
   * Overrides BaseService findAll to include vector data
   */
  async getAll(query?: { q?: string }): Promise<AgentMemoryDro[]> {
    const where = query?.q
      ? {
          OR: [
            { content: { contains: query.q, mode: 'insensitive' } },
            { type: { contains: query.q, mode: 'insensitive' } },
            { agentId: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {};

    const memories = await this.repository.findMany<AgentMemoryDro>(
      Object.keys(where).length ? where : undefined,
    );

    // Fetch vector info from Redis for each memory
    const vectorIds = memories
      .map((mem: any) => mem.vectorId)
      .filter((id: any): id is string => typeof id === 'string');
    const vectors = await vectorService.getVectorsByIds(vectorIds);

    const results = memories.map((mem: any, idx: number) => ({
      ...mem,
      vector: vectors[idx],
    }));
    return results;
  }

  /**
   * Get memory by ID, including vector info from Redis
   * Overrides BaseService findOne to include vector data
   */
  async getById(id: string): Promise<AgentMemoryDro | null> {
    const mem = await this.repository.findById<AgentMemoryDro>(id);
    if (!mem) return null;

    let vector = null;
    if ((mem as any).vectorId) {
      vector = await vectorService.getVectorById((mem as any).vectorId);
    }
    return { ...mem, vector } as AgentMemoryDro;
  }

  /**
   * Update memory (does not update embedding/vector)
   * Overrides BaseService update to handle memory-specific cleanup
   */
  async update(id: string, data: Partial<AgentMemoryDto>): Promise<AgentMemoryDro | null> {
    const cleanData = { ...data };
    delete (cleanData as any).embedding;
    return this.repository.update<AgentMemoryDto, AgentMemoryDro>(id, cleanData);
  }

  /**
   * Delete memory and optionally remove vector from Redis
   * Overrides BaseService delete to handle vector cleanup
   */
  async delete(id: string): Promise<AgentMemoryDro> {
    const mem = await this.repository.findById<AgentMemoryDro>(id);
    if (mem && (mem as any).vectorId) {
      await vectorService.removeVectorDataById((mem as any).vectorId);
    }
    return this.repository.delete<AgentMemoryDro>(id);
  }
}

// Export a singleton instance for convenience
export const memoryService = new MemoryService();
