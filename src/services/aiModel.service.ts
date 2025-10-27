import { PrismaClient, AIModel } from '@prisma/client';
import { BaseService } from './base.service';
import { AIModelRepository } from '../repositories/aimodel.repository';
import { AIModelDto } from '../interfaces';

const prisma = new PrismaClient();

export class AIModelService extends BaseService<any, AIModelDto, AIModelDto> {
  private aiModelRepository: AIModelRepository;

  constructor() {
    const aiModelRepository = new AIModelRepository();
    super(aiModelRepository);
    this.aiModelRepository = aiModelRepository;
  }

  async createAIModel(data: Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIModel> {
    const existing = await this.aiModelRepository.findByName(data.name);
    if (existing) {
      throw new Error('Model name already exists');
    }
    return this.aiModelRepository.create(data as any);
  }

  async getAIModelById(id: string): Promise<AIModel | null> {
    return this.aiModelRepository.findById(id);
  }

  async getAllAIModels(): Promise<AIModel[]> {
    return this.aiModelRepository.findMany();
  }

  async updateAIModel(id: string, data: Partial<Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>>): Promise<AIModel> {
    if (data.name) {
      const existing: any = await this.aiModelRepository.search({
        where: { name: data.name, NOT: { id } },
      });
      if (existing && existing.length > 0) {
        throw new Error('Model name already exists');
      }
    }
    return this.aiModelRepository.update(id, data);
  }

  async deleteAIModel(id: string): Promise<AIModel> {
    return this.aiModelRepository.delete(id);
  }

  async getAIModelsByType(type: string) {
    return this.aiModelRepository.findByType(type);
  }

  async getAIModelsByPlatform(platformId: string) {
    return this.aiModelRepository.findByPlatformId(platformId);
  }
}

export const aiModelService = new AIModelService();
