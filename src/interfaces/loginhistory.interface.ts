import { BaseInterface } from './base.interface';

export interface LoginHistoryModel extends BaseInterface {
    id: string;
    ssoId?: string | null;
    userId: string;
    deviceIP?: string | null;
    userAgent?: string | null;
    loginAt: Date;
    logoutAt?: Date | null;
    status: string;
    location?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface LoginHistoryDto {
    ssoId?: string | null;
    userId: string;
    deviceIP?: string | null;
    userAgent?: string | null;
    loginAt?: Date;
    logoutAt?: Date | null;
    status?: string;
    location?: string | null;
}
