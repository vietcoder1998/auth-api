import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { LoginHistoryDto, LoginHistoryModel } from '../interfaces';

export class LoginHistoryRepository extends BaseRepository<LoginHistoryModel, LoginHistoryDto, LoginHistoryDto> {
    constructor(loginHistoryDelegate: any = prisma.loginHistory) {
        super(loginHistoryDelegate);
    }

    async findByUserId(userId: string) {
        return (this.model as any).findMany({ 
            where: { userId },
            orderBy: { loginAt: 'desc' }
        });
    }

    async findActiveByUserId(userId: string) {
        return (this.model as any).findMany({ 
            where: { 
                userId,
                status: 'active'
            },
            orderBy: { loginAt: 'desc' }
        });
    }

    async findBySsoId(ssoId: string) {
        return (this.model as any).findMany({ 
            where: { ssoId },
            orderBy: { loginAt: 'desc' }
        });
    }

    async logoutSession(id: string) {
        return (this.model as any).update({
            where: { id },
            data: {
                status: 'logged_out',
                logoutAt: new Date()
            }
        });
    }

    async logoutAllUserSessions(userId: string) {
        return (this.model as any).updateMany({
            where: {
                userId,
                status: 'active'
            },
            data: {
                status: 'logged_out',
                logoutAt: new Date()
            }
        });
    }

    async expireOldSessions(cutoffDate: Date) {
        return (this.model as any).updateMany({
            where: {
                status: 'active',
                loginAt: {
                    lt: cutoffDate
                }
            },
            data: {
                status: 'expired'
            }
        });
    }
}
