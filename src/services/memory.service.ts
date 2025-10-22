import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class MemoryService {
  static async create(data: any) {
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
