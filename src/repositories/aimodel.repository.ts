import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { AIModelDto, AIModelModel } from '../interfaces';

export class AIModelRepository extends BaseRepository<AIModelModel, AIModelDto, AIModelDto> {
    constructor(aiModelDelegate = prisma.aIModel) {
        super(aiModelDelegate);
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
            include: { platform: true }
        });
    }
}
