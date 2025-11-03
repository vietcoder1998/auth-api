import { PrismaClient, AIModel as PrismaAIModel } from '@prisma/client';
import { AIModel, AIModelDro, AIModelDto } from '../interfaces';
import { AIModelRepository, aiModelRepository } from '../repositories';
import { BaseService } from './base.service';

const prisma = new PrismaClient();

export class AIModelService extends BaseService<AIModel, AIModelDto, AIModelDro> {
  constructor() {
    super(aiModelRepository);
  }

  get aiModelRepository(): AIModelRepository {
    return this.repository as AIModelRepository;
  }

  /**
   * Override search/findMany to include agents relation by default
   */
  async search(params?: any): Promise<AIModelDro[]> {
    const searchParams = {
      ...params,
      include: {
        agents: true,
        platform: true,
        ...(params?.include || {}),
      },
    };
    return this.aiModelRepository.search(searchParams);
  }

  /**
   * Override findMany to include agents relation by default
   */
  async findMany(where?: Record<string, any>): Promise<any[]> {
    const searchParams = {
      where,
      include: {
        agents: true,
        platform: true,
        ...(where?.include || {}),
      },
    };
    return this.repository.findMany(searchParams);
  }

  async createAIModel(data: AIModelDto): Promise<AIModelDro> {
    const existing = await this.aiModelRepository.findByName(data.name);
    if (existing) {
      throw new Error('Model name already exists');
    }
    return this.aiModelRepository.create(data as any);
  }

  async getAIModelById(id: string): Promise<PrismaAIModel | null> {
    return this.aiModelRepository.findById(id);
  }

  async getAllAIModels(): Promise<PrismaAIModel[]> {
    return this.aiModelRepository.findMany();
  }

  async updateAIModel(
    id: string,
    data: Partial<AIModelDto>,
  ): Promise<AIModelDro | null> {
    if (data?.name) {
      const existing: any = await this.aiModelRepository.search({
        where: { name: data.name, NOT: { id } },
      });
      if (existing && existing.length > 0) {
        throw new Error('Model name already exists');
      }
    }
    return this.aiModelRepository.update(id, data);
  }

  async deleteAIModel(id: string): Promise<PrismaAIModel> {
    return this.aiModelRepository.delete(id);
  }

  async getAIModelsByType(type: string) {
    return this.aiModelRepository.findByType(type);
  }

  async getAIModelsByPlatform(platformId: string) {
    return this.aiModelRepository.findByPlatformId(platformId);
  }

  async fetchGeminiModels(geminiConfig: any): Promise<string[]> {
    const { default: GeminiService } = await import('./gemini.service');
    return GeminiService.pingEnabledGeminiModels(geminiConfig);
  }
}

export const aiModelService = new AIModelService();
