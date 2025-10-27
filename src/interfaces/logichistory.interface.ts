import { BaseInterface } from './base.interface';

export interface LogicHistoryModel extends BaseInterface {
    id: string;
    userId: string;
    action: string;
    entityType?: string | null;
    entityId?: string | null;
    oldValues?: string | null;
    newValues?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    notificationTemplateId?: string | null;
    notificationSent: boolean;
    createdAt: Date;
}

export interface LogicHistoryDto {
    userId: string;
    action: string;
    entityType?: string | null;
    entityId?: string | null;
    oldValues?: string | null;
    newValues?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    notificationTemplateId?: string | null;
    notificationSent?: boolean;
}
