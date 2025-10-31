import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { TokenDto, TokenModel } from '../interfaces';

export class TokenRepository extends BaseRepository<TokenModel, TokenDto, TokenDto> {
    constructor(tokenDelegate = prisma.token) {
        super(tokenDelegate);
    }

    async findByAccessToken(accessToken: string) {
        return this.model.findFirst({ where: { accessToken } });
    }

    async findByRefreshToken(refreshToken: string) {
        return this.model.findFirst({ where: { refreshToken } });
    }

    async findByUserId(userId: string) {
        return this.model.findMany({ 
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async deleteExpired() {
        const now = new Date();
        return this.model.deleteMany({
            where: {
                refreshExpiresAt: {
                    lt: now
                }
            }
        });
    }
}

export const tokenRepository = new TokenRepository();