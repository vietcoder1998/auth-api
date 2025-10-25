import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { SSODto, SSOModel } from '../interfaces';

export class SSORepository extends BaseRepository<SSOModel, SSODto, SSODto> {
    constructor(ssoDelegate = prisma.sSO) {
        super(ssoDelegate);
    }

    // Note: SSO model doesn't have provider or providerId fields in schema
    // Only has: url, key, ssoKey, userId, deviceIP, etc.
    
    async findByUserId(userId: string) {
        return this.model.findMany({ where: { userId } });
    }

    async findBySsoKey(ssoKey: string) {
        return this.model.findFirst({ where: { ssoKey } });
    }

    async findByKey(key: string) {
        return this.model.findFirst({ where: { key } });
    }
}
