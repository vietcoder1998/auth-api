import { PrismaClient } from '@prisma/client';
import { BaseService } from './base.service';
import { AIPlatformRepository } from '../repositories/aiplatform.repository';
import { AIPlatformDto } from '../interfaces';

const prisma = new PrismaClient();

class AIPlatformService extends BaseService<any, AIPlatformDto, AIPlatformDto> {
  private aiPlatformRepository: AIPlatformRepository;

  constructor() {
    const aiPlatformRepository = new AIPlatformRepository();
    super(aiPlatformRepository);
    this.aiPlatformRepository = aiPlatformRepository;
  }

  async createAIPlatform(data: any) {
    const { aiModelIds, ...rest } = data;
    return this.aiPlatformRepository.create({
      ...rest,
      models: aiModelIds && Array.isArray(aiModelIds)
        ? { connect: aiModelIds.map((id: string) => ({ id })) }
        : undefined,
    } as any);
  }

  async getAIPlatforms() {
    return this.aiPlatformRepository.findMany();
  }

  async getAIPlatformById(id: string) {
    return this.aiPlatformRepository.findById(id);
  }

  async getAIPlatformByName(name: string) {
    return this.aiPlatformRepository.findByName(name);
  }

  async getAIPlatformWithKeys(id: string) {
    return this.aiPlatformRepository.findWithKeys(id);
  }

  async updateAIPlatform(id: string, data: any) {
    const { aiModelIds, ...rest } = data;
    return this.aiPlatformRepository.update(id, {
      ...rest,
      models: aiModelIds && Array.isArray(aiModelIds)
        ? { set: aiModelIds.map((id: string) => ({ id })) }
        : undefined,
    } as any);
  }

  async deleteAIPlatform(id: string) {
    return this.aiPlatformRepository.delete(id);
  }
}

export const aiPlatformService = new AIPlatformService();

// Export individual functions for backward compatibility
export const createAIPlatform = (data: any) => aiPlatformService.createAIPlatform(data);
export const getAIPlatforms = () => aiPlatformService.getAIPlatforms();
export const getAIPlatformById = (id: string) => aiPlatformService.getAIPlatformById(id);
export const updateAIPlatform = (id: string, data: any) => aiPlatformService.updateAIPlatform(id, data);
export const deleteAIPlatform = (id: string) => aiPlatformService.deleteAIPlatform(id);
