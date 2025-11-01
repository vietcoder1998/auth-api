import { vectorService } from './vector.service';
import { BaseService } from './base.service';
import { AgentMemoryRepository } from '../repositories/agentmemory.repository';
import { AgentMemoryModel, AgentMemoryDto, AgentMemoryDro } from '../interfaces/agentmemory.interface';

export class MemoryService extends BaseService<AgentMemoryModel, AgentMemoryDto, AgentMemoryDro> {
  private agentMemoryRepository: AgentMemoryRepository;

  constructor() {
    const memoryRepository = new AgentMemoryRepository();
    super(memoryRepository);
    this.agentMemoryRepository = memoryRepository;
  }
  /**
   * Create a memory and save its embedding to Redis vector DB.
   * Overrides BaseService create to handle memory-specific logic
   */
  async create<T = AgentMemoryDto>(data: T): Promise<AgentMemoryDro> {
    const memoryData = data as any;
    
    // If type is 'user', call LLMService to generate a prompt
    if (memoryData.type === 'user') {
      const { llmService } = await import('./llm.service');
      // Prepare prompt message
      const agentId = memoryData.agentId;
      const promptMessage = typeof memoryData.content === 'string' ? memoryData.content : JSON.stringify(memoryData.content);
      // Call LLMService to generate response
      const llmResponse = await llmService.generateResponse([
        { role: 'user', content: promptMessage }
      ], {
        agentId,
        modelType: memoryData.modelType || 'gpt',
      });
      // Save the generated prompt as content
      memoryData.content = llmResponse.content;
    }
    
    if (memoryData.content) {
      // Ensure content is a string for Prisma
      if (typeof memoryData.content === 'object') {
        memoryData.content = JSON.stringify(memoryData.content);
      }
      const vector = await vectorService.saveMessage(memoryData.content);
      if (vector) {
        memoryData.vectorId = vector.vectorId;
      }
    }
    delete memoryData.embedding; // Remove legacy field if present
    
    // Fix: Use connect for agent and conversation relations
    // Remove messageId if present, as it's not a valid field
    const { agentId, conversationId, messageId, content, ...rest } = memoryData;
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
    
    return this.repository.create<typeof processedData, AgentMemoryDro>(processedData);
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
    
    const memories = await this.repository.findMany<AgentMemoryDro>(Object.keys(where).length ? where : undefined);

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
