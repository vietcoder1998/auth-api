import { PrismaClient } from '@prisma/client';
import { BaseService } from './base.service';
import { AIKeyRepository } from '../repositories/aikey.repository';
import { AIKeyDto } from '../interfaces';

const prisma = new PrismaClient();

class AIKeyService extends BaseService<any, AIKeyDto, AIKeyDto> {
  private aiKeyRepository: AIKeyRepository;

  constructor() {
    const aiKeyRepository = new AIKeyRepository();
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
        Conversation: true,
        user: true,
      },
    });
  }

  async getAIKeyById(id: string) {
    return this.aiKeyRepository.search({
      where: { id },
      include: { platform: true, billing: true },
    }).then(results => results[0] || null);
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

// Export individual functions for backward compatibility
export const createAIKey = (data: any) => aiKeyService.createAIKey(data);
export const getAIKeys = () => aiKeyService.getAIKeys();
export const getAIKeyById = (id: string) => aiKeyService.getAIKeyById(id);
export const updateAIKey = (id: string, data: any) => aiKeyService.updateAIKey(id, data);
export const deleteAIKey = (id: string) => aiKeyService.deleteAIKey(id);
