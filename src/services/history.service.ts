import { PrismaClient } from '@prisma/client';
import { LoginHistoryRepository, LogicHistoryRepository } from '../repositories';
import { BaseService } from './base.service';
import { LoginHistoryDto, LogicHistoryDto } from '../interfaces';

const prisma = new PrismaClient();

interface LoginHistoryData {
  userId: string;
  ssoId?: string;
  deviceIP?: string;
  userAgent?: string;
  location?: string;
}

interface LogicHistoryData {
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  notificationTemplateId?: string;
}

export class HistoryService extends BaseService<any, LoginHistoryDto, LoginHistoryDto> {
  protected logicHistoryRepository: LogicHistoryRepository;

  constructor() {
    const loginHistoryRepository = new LoginHistoryRepository();
    super(loginHistoryRepository);
    this.logicHistoryRepository = new LogicHistoryRepository();
  }

  /**
   * Create a login history entry
   */
  async createLoginHistory(data: LoginHistoryData): Promise<any | null> {
    try {
      return await this.repository.create({
        userId: data.userId,
        ssoId: data.ssoId || null,
        deviceIP: data.deviceIP || null,
        userAgent: data.userAgent || null,
        location: data.location || null,
        status: 'active',
      });
    } catch (error) {
      console.error('Failed to create login history:', error);
      return null;
    }
  }

  /**
   * Update login history entry on logout
   */
  async logoutUser(loginHistoryId: string): Promise<any | null> {
    try {
      return await (this.repository as LoginHistoryRepository).logoutSession(loginHistoryId);
    } catch (error) {
      console.error('Failed to update logout:', error);
      return null;
    }
  }
  /**
   * Create a logic history entry for audit trail
   */
  async createLogicHistory(data: LogicHistoryData): Promise<any | null> {
    try {
      return await this.logicHistoryRepository.create({
        userId: data.userId,
        action: data.action,
        entityType: data.entityType || null,
        entityId: data.entityId || null,
        oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
        newValues: data.newValues ? JSON.stringify(data.newValues) : null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        notificationTemplateId: data.notificationTemplateId || null,
        notificationSent: false,
      });
    } catch (error) {
      console.error('Failed to create logic history:', error);
      return null;
    }
  }

  /**
   * Helper to extract IP address from request
   */
  getClientIP(req: any): string | undefined {
    return (
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip']
    );
  }

  /**
   * Helper to get user agent from request
   */
  getUserAgent(req: any): string | undefined {
    return req.headers['user-agent'];
  }
  /**
   * Create login history and logic history for successful login
   */
  async recordLogin(userId: string, req: any, ssoId?: string): Promise<any | null> {
    const ip = this.getClientIP(req);
    const userAgent = this.getUserAgent(req);

    // Create login history
    const loginHistory = await this.createLoginHistory({
      userId,
      ssoId,
      deviceIP: ip,
      userAgent,
    });

    // Create logic history for login action
    await this.createLogicHistory({
      userId,
      action: 'login',
      ipAddress: ip,
      userAgent,
      notificationTemplateId: await this.getNotificationTemplateId('user_login'),
    });

    return loginHistory;
  }
  /**
   * Record user action for audit trail
   */
  async recordUserAction(
    userId: string,
    action: string,
    req: any,
    options?: {
      entityType?: string;
      entityId?: string;
      oldValues?: any;
      newValues?: any;
      notificationTemplateName?: string;
    },
  ): Promise<any | null> {
    const ip = this.getClientIP(req);
    const userAgent = this.getUserAgent(req);

    let notificationTemplateId: string | undefined;
    if (options?.notificationTemplateName) {
      notificationTemplateId = await this.getNotificationTemplateId(
        options.notificationTemplateName,
      );
    }

    return await this.createLogicHistory({
      userId,
      action,
      entityType: options?.entityType,
      entityId: options?.entityId,
      oldValues: options?.oldValues,
      newValues: options?.newValues,
      ipAddress: ip,
      userAgent,
      notificationTemplateId,
    });
  }

  /**
   * Get notification template ID by name
   */
  private async getNotificationTemplateId(
    templateName: string,
  ): Promise<string | undefined> {
    try {
      const template = await prisma.notificationTemplate.findUnique({
        where: { name: templateName },
        select: { id: true },
      });
      return template?.id;
    } catch (error) {
      console.error('Failed to get notification template:', error);
      return undefined;
    }
  }  /**
   * Get active login sessions for a user
   */
  async getActiveUserSessions(userId: string): Promise<any[]> {
    try {
      return await (this.repository as LoginHistoryRepository).findActiveByUserId(userId);
    } catch (error) {
      console.error('Failed to get active sessions:', error);
      return [];
    }
  }

  /**
   * Force logout all sessions for a user
   */
  async forceLogoutAllSessions(userId: string): Promise<any | null> {
    try {
      return await (this.repository as LoginHistoryRepository).logoutAllUserSessions(userId);
    } catch (error) {
      console.error('Failed to force logout sessions:', error);
      return null;
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(maxAgeHours = 24): Promise<any | null> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - maxAgeHours);

      return await (this.repository as LoginHistoryRepository).expireOldSessions(cutoffDate);
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
      return null;
    }
  }
}

export const historyService = new HistoryService();
