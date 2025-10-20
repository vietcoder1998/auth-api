import { PrismaClient } from '@prisma/client';

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

export class HistoryService {
  /**
   * Create a login history entry
   */
  static async createLoginHistory(data: LoginHistoryData) {
    try {
      return await prisma.loginHistory.create({
        data: {
          userId: data.userId,
          ssoId: data.ssoId || null,
          deviceIP: data.deviceIP || null,
          userAgent: data.userAgent || null,
          location: data.location || null,
          status: 'active',
        },
      });
    } catch (error) {
      console.error('Failed to create login history:', error);
      return null;
    }
  }

  /**
   * Update login history entry on logout
   */
  static async logoutUser(loginHistoryId: string) {
    try {
      return await prisma.loginHistory.update({
        where: { id: loginHistoryId },
        data: {
          status: 'logged_out',
          logoutAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to update logout:', error);
      return null;
    }
  }

  /**
   * Create a logic history entry for audit trail
   */
  static async createLogicHistory(data: LogicHistoryData) {
    try {
      return await prisma.logicHistory.create({
        data: {
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
        },
      });
    } catch (error) {
      console.error('Failed to create logic history:', error);
      return null;
    }
  }

  /**
   * Helper to extract IP address from request
   */
  static getClientIP(req: any): string | undefined {
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
  static getUserAgent(req: any): string | undefined {
    return req.headers['user-agent'];
  }

  /**
   * Create login history and logic history for successful login
   */
  static async recordLogin(userId: string, req: any, ssoId?: string) {
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
  static async recordUserAction(
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
  ) {
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
  private static async getNotificationTemplateId(
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
  }

  /**
   * Get active login sessions for a user
   */
  static async getActiveUserSessions(userId: string) {
    try {
      return await prisma.loginHistory.findMany({
        where: {
          userId,
          status: 'active',
        },
        orderBy: { loginAt: 'desc' },
      });
    } catch (error) {
      console.error('Failed to get active sessions:', error);
      return [];
    }
  }

  /**
   * Force logout all sessions for a user
   */
  static async forceLogoutAllSessions(userId: string) {
    try {
      return await prisma.loginHistory.updateMany({
        where: {
          userId,
          status: 'active',
        },
        data: {
          status: 'logged_out',
          logoutAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to force logout sessions:', error);
      return null;
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(maxAgeHours = 24) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - maxAgeHours);

      return await prisma.loginHistory.updateMany({
        where: {
          status: 'active',
          loginAt: {
            lt: cutoffDate,
          },
        },
        data: {
          status: 'expired',
        },
      });
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
      return null;
    }
  }
}

export const historyService = new HistoryService();
