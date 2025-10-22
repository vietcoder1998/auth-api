import { PrismaClient } from '@prisma/client';
import { convertToVector } from '../utils/embervector';
const prisma = new PrismaClient();

export class MemoryService {
  static async create(data: any) {
    // Embed vector and token count before saving
    if (data.content) {
      const { vector, tokens } = await convertToVector(data.content);
      data.embedding = vector;
      data.tokens = tokens;
    }
    return prisma.agentMemory.create({ data });
  }

  static async getAll() {
    return prisma.agentMemory.findMany();
  }

  static async getById(id: string) {
    return prisma.agentMemory.findUnique({ where: { id } });
  }

  static async update(id: string, data: any) {
    return prisma.agentMemory.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return prisma.agentMemory.delete({ where: { id } });
  }
}
