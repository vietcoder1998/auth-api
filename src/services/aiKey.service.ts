import { AIKeyDto, AIKeyModel } from '../interfaces';
import { AIKeyRepository, aiKeyRepository } from '../repositories/aikey.repository';
import { BaseService } from './base.service';

export class AIKeyService extends BaseService<AIKeyModel, AIKeyDto, AIKeyDto> {
  constructor() {
    super(aiKeyRepository);
  }

  get aiKeyRepository(): AIKeyRepository {
    return this.repository as AIKeyRepository;
  }

  async createAIKey(data: any) {
    const { agentIds, ...restData } = data;
    
    // Transform agentIds to proper Prisma relationship format
    const createData: any = { ...restData };
    
    if (agentIds && Array.isArray(agentIds) && agentIds.length > 0) {
      createData.agents = {
        create: agentIds.map((agentId: string) => ({
          agentId: agentId
        }))
      };
    }
    
    return this.aiKeyRepository.create(createData);
  }

  async getAIKeys() {
    return this.aiKeyRepository.search({
      include: {
        platform: true,
        billing: true,
        agents: {
          include: {
            agent: true,
          },
        },
        user: true,
      },
    });
  }

  async getAIKeyById(id: string) {
    return this.aiKeyRepository
      .search({
        where: { id },
        include: { platform: true, billing: true, agents: true, Conversation: true, user: true },
      })
      .then((results) => results[0] || null);
  }

  async updateAIKey(id: string, data: any) {
    const { agentIds, ...restData } = data;
    
    // Transform agentIds to proper Prisma relationship format
    const updateData: any = { ...restData };
    
    if (agentIds !== undefined && Array.isArray(agentIds)) {
      updateData.agents = {
        deleteMany: {}, // Remove all existing relationships
      };
      
      if (agentIds.length > 0) {
        updateData.agents.create = agentIds.map((agentId: string) => ({
          agentId: agentId
        }));
      }
    }
    
    return this.aiKeyRepository.update(id, updateData);
  }

  async deleteAIKey(id: string) {
    return this.aiKeyRepository.delete(id);
  }

  async getAIKeysByUserId(userId: string) {
    return this.aiKeyRepository.findByUserId(userId);
  }

  async getActiveAIKeys() {
    return this.aiKeyRepository.findActive();
  }

  async findByKey(key: string) {
    return this.aiKeyRepository.findByKey(key);
  }


}

export const aiKeyService = new AIKeyService();
