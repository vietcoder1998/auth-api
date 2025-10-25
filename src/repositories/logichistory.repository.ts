import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { LogicHistoryDto, LogicHistoryModel } from '../interfaces';

export class LogicHistoryRepository extends BaseRepository<LogicHistoryModel, LogicHistoryDto, LogicHistoryDto> {
    constructor(logicHistoryDelegate: any = prisma.logicHistory) {
        super(logicHistoryDelegate);
    }

    async findByUserId(userId: string) {
        return (this.model as any).findMany({ 
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findByAction(action: string) {
        return (this.model as any).findMany({ 
            where: { action },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findByEntity(entityType: string, entityId: string) {
        return (this.model as any).findMany({ 
            where: { 
                entityType,
                entityId 
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findByEntityType(entityType: string) {
        return (this.model as any).findMany({ 
            where: { entityType },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findPendingNotifications() {
        return (this.model as any).findMany({ 
            where: { 
                notificationSent: false,
                notificationTemplateId: {
                    not: null
                }
            },
            orderBy: { createdAt: 'asc' }
        });
    }

    async markNotificationSent(id: string) {
        return (this.model as any).update({
            where: { id },
            data: { notificationSent: true }
        });
    }
}
