import { AIModel as PrismaAIModel } from '@prisma/client';
import { AIModel, AIModelDro, AIModelDto } from '../interfaces';
import { AIModelRepository, aiModelRepository } from '../repositories';
import { BaseService } from './base.service';
import { GeminiService } from './gemini.service';

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
    return this.aiModelRepository.findMany(searchParams);
  }

  public override async create<T = AIModelDto>(data: T): Promise<AIModelDro> {
    const payload = data as AIModelDto;
    const existing = await this.aiModelRepository.findByName(payload.name);
    if (existing) {
      throw new Error('Model name already exists');
    }

    // Validate required fields
    if (!payload.type) {
      throw new Error('Model type is required');
    }

    // Extract relation fields and ensure they're not in the rest data
    const { agentIds, platformId, ...rest } = payload;

    // Explicitly remove these fields if they somehow remain
    delete (rest as any).agentIds;
    delete (rest as any).platformId;

    // Build the create data with proper relations
    const createData: any = {
      name: rest.name,
      type: rest.type,
      description: rest.description,
    };

    // Add agents relation if provided
    if (agentIds && Array.isArray(agentIds) && agentIds.length > 0) {
      createData.agents = { connect: agentIds.map((id: string) => ({ id })) };
    }

    // Add platform relation if provided
    if (platformId) {
      createData.platform = { connect: { id: platformId } };
    }

    const newAiModel = await this.aiModelRepository.create(createData);

    return newAiModel;
  }

  async getAIModelById(id: string): Promise<PrismaAIModel | null> {
    return this.aiModelRepository.findById(id);
  }

  async getAllAIModels(): Promise<PrismaAIModel[]> {
    return this.aiModelRepository.findMany();
  }

  public override async update(id: string, data: Partial<AIModelDto>): Promise<AIModelDro | null> {
    if (data?.name) {
      const existing: any = await this.aiModelRepository.search({
        where: { name: data.name, NOT: { id } },
      });
      if (existing && existing.length > 0) {
        throw new Error('Model name already exists');
      }
    }

    // Extract relation fields and ensure they're not in the rest data
    const { agentIds, platformId, ...rest } = data;

    // Explicitly remove these fields if they somehow remain
    delete (rest as any).agentIds;
    delete (rest as any).platformId;

    // Build the update data - only include fields that are actually provided
    const updateData: any = {};

    if (rest.name !== undefined) updateData.name = rest.name;
    if (rest.type !== undefined) updateData.type = rest.type;
    if (rest.description !== undefined) updateData.description = rest.description;

    // Update agents relation if provided
    if (agentIds !== undefined && Array.isArray(agentIds)) {
      updateData.agents = { set: agentIds.map((id: string) => ({ id })) };
    }

    // Update platform relation if provided
    if (platformId !== undefined) {
      if (platformId) {
        updateData.platform = { connect: { id: platformId } };
      } else {
        updateData.platform = { disconnect: true };
      }
    }

    return this.aiModelRepository.update(id, updateData);
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
    return GeminiService.pingEnabledGeminiModels(geminiConfig);
  }
}

export const aiModelService = new AIModelService();
