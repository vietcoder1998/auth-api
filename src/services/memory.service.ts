import { PrismaClient } from '@prisma/client';
import { vectorService } from './vector.service';
const prisma = new PrismaClient();

export class MemoryService {
  /**
   * Create a memory and save its embedding to Redis vector DB.
   */
  static async create(data: any) {
    if (data.content) {
      const vector = await vectorService.saveMessage(data.content);
      if (vector) {
        data.vectorId = vector.vectorId;
      }
    }
    delete data.embedding; // Remove legacy field if present
    return prisma.agentMemory.create({ data });
  }

  /**
   * Get all memories, with vector info from Redis
   */
  static async getAll(query?: { q?: string }) {
    const where = query?.q
      ? {
          OR: [
            { content: { contains: query.q, mode: 'insensitive' } },
            { type: { contains: query.q, mode: 'insensitive' } },
            { agentId: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {};
    const memories = await prisma.agentMemory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Fetch vector info from Redis for each memory
    const vectorIds = memories
      .map(mem => mem.vectorId)
      .filter((id): id is string => typeof id === 'string');
    const vectors = await vectorService.getVectorsByIds(vectorIds);

    const results = memories.map((mem, idx) => ({
      ...mem,
      vector: vectors[idx]
    }));
    return results;
  }

  /**
   * Get memory by ID, including vector info from Redis
   */
  static async getById(id: string) {
    const mem = await prisma.agentMemory.findUnique({ where: { id } });
    let vector = null;
    if (mem?.vectorId) {
      vector = await vectorService.getVectorById(mem.vectorId);
    }
    return mem ? { ...mem, vector } : null;
  }

  /**
   * Update memory (does not update embedding/vector)
   */
  static async update(id: string, data: any) {
    delete data.embedding;
    return prisma.agentMemory.update({ where: { id }, data });
  }

  /**
   * Delete memory and optionally remove vector from Redis
   */
  static async delete(id: string) {
    const mem = await prisma.agentMemory.findUnique({ where: { id } });
    if (mem?.vectorId) {
      await vectorService.removeVectorDataById(mem.vectorId);
    }
    return prisma.agentMemory.delete({ where: { id } });
  }
}
