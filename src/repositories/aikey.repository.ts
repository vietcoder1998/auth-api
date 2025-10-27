import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { AIKeyDto, AIKeyModel } from '../interfaces';

export class AIKeyRepository extends BaseRepository<AIKeyModel, AIKeyDto, AIKeyDto> {
    constructor(aiKeyDelegate = prisma.aIKey) {
        super(aiKeyDelegate);
    }

    async findByKey(key: string) {
        return this.model.findFirst({ where: { key } });
    }

    async findByUserId(userId: string) {
        return this.model.findMany({ 
            where: { userId },
            include: { platform: true }
        });
    }

    async findActive() {
        return this.model.findMany({ 
            where: { isActive: true },
            include: { platform: true }
        });
    }

    async findByPlatformId(platformId: string) {
        return this.model.findMany({ 
            where: { platformId, isActive: true }
        });
    }
}
