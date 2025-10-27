import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { ApiKeyDto, ApiKeyModel } from '../interfaces';

export class ApiKeyRepository extends BaseRepository<ApiKeyModel, ApiKeyDto, ApiKeyDto> {
    constructor(apiKeyDelegate = prisma.apiKey) {
        super(apiKeyDelegate);
    }

    async findByKey(key: string) {
        return this.model.findFirst({ 
            where: { key },
            include: { user: true }
        });
    }

    async findByUserId(userId: string) {
        return this.model.findMany({ 
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findActive() {
        return this.model.findMany({ 
            where: { isActive: true }
        });
    }
}
