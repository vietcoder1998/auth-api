import { PrismaClient, AIModel } from '@prisma/client';

const prisma = new PrismaClient();

export class AIModelService {
  async createAIModel(data: Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIModel> {
    return prisma.aIModel.create({ data });
  }

  async getAIModelById(id: string): Promise<AIModel | null> {
    return prisma.aIModel.findUnique({ where: { id } });
  }

  async getAllAIModels(): Promise<AIModel[]> {
    return prisma.aIModel.findMany();
  }

  async updateAIModel(id: string, data: Partial<Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>>): Promise<AIModel> {
    return prisma.aIModel.update({ where: { id }, data });
  }

  async deleteAIModel(id: string): Promise<AIModel> {
    return prisma.aIModel.delete({ where: { id } });
  }
}

export const aiModelService = new AIModelService();
