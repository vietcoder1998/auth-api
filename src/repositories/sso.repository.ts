import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { SSODto, SSOModel } from '../interfaces';

export class SSORepository extends BaseRepository<SSOModel, SSODto, SSODto> {
    constructor(ssoDelegate = prisma.sSO) {
        super(ssoDelegate);
    }

    async findByProvider(provider: string) {
        return this.model.findMany({ where: { provider } });
    }

    async findByUserId(userId: string) {
        return this.model.findMany({ where: { userId } });
    }

    async findByProviderAndProviderId(provider: string, providerId: string) {
        return this.model.findFirst({ 
            where: { provider, providerId }
        });
    }
}
