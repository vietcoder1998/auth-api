import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { AIKeyDro, AIKeyDto, AIKeyModel } from '../interfaces';

export class AIKeyRepository extends BaseRepository<AIKeyModel, AIKeyDto, AIKeyDto> {
    constructor(aiKeyDelegate = prisma.aIKey) {
        super(aiKeyDelegate);
    }

    get aiKeyModel(): AIKeyModel {
        return this.model as AIKeyModel;
    }

    async findByKey(key: string) {
        return this.aiKeyModel.findFirst({ where: { key } });
    }

    async findByUserId(userId: string) {
        return this.aiKeyModel.findMany({ 
            where: { userId },
            include: { platform: true }
        });
    }

    async findActive() {
        return this.aiKeyModel.findMany({ 
            where: { isActive: true },
            include: { platform: true }
        });
    }

    async findByPlatformId(platformId: string) {
        return this.aiKeyModel.findMany({ 
            where: { platformId, isActive: true }
        });
    }

    async findByAgentId(agentId: string): Promise<AIKeyDro | null> {
        return this.aiKeyModel.findFirst({
            where: {
                agents: {
                    some: {
                        agentId: agentId,
                    },
                },
                isActive: true,
            },
        });
    }
}

export const aiKeyRepository = new AIKeyRepository();