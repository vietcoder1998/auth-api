import { AIKeyDto, AIKeyModel } from '../interfaces';
import { AIKeyRepository, aiKeyRepository } from '../repositories/aikey.repository';
import { BaseService } from './base.service';

export class AIKeyService extends BaseService<AIKeyModel, AIKeyDto, AIKeyDto> {
  private readonly aiKeyRepository: AIKeyRepository;

  constructor() {
    super(aiKeyRepository);
    this.aiKeyRepository = aiKeyRepository;
  }

  async createAIKey(data: any) {
    return this.aiKeyRepository.create(data);
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
    return this.aiKeyRepository.update(id, data);
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
