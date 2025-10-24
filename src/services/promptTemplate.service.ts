import { PrismaClient, PromptTemplate } from '@prisma/client';

const prisma = new PrismaClient();

export class PromptTemplateService {
  async create(data: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<PromptTemplate> {
    return prisma.promptTemplate.create({ data });
  }

  async findAll(): Promise<PromptTemplate[]> {
    return prisma.promptTemplate.findMany();
  }

  async findById(id: string): Promise<PromptTemplate | null> {
    return prisma.promptTemplate.findUnique({ where: { id } });
  }

  async update(id: string, data: Partial<Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>>): Promise<PromptTemplate> {
    return prisma.promptTemplate.update({ where: { id }, data });
  }

  async delete(id: string): Promise<PromptTemplate> {
    return prisma.promptTemplate.delete({ where: { id } });
  }
}
