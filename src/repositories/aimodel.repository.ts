import { AIModelDto, AIModelDro, AIModel } from '../interfaces';
import { prisma } from '../setup';
import { BaseRepository } from './base.repository';

export class AIModelRepository extends BaseRepository<AIModel, AIModelDto, AIModelDro> {
  constructor() {
    super(prisma.aIModel);
  }

  async findByName(name: string) {
    return this.model.findFirst({ where: { name } });
  }

  async findByType(type: string) {
    return this.model.findMany({ where: { type } });
  }

  async findByPlatformId(platformId: string) {
    return this.model.findMany({
      where: { platformId },
      include: { platform: true },
    });
  }
}

export const aiModelRepository = new AIModelRepository();
