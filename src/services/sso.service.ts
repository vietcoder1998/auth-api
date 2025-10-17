import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface CreateSSOData {
  url: string;
  userId: string;
  deviceIP?: string;
  expiresAt?: Date;
}

export interface UpdateSSOData {
  url?: string;
  deviceIP?: string;
  isActive?: boolean;
  expiresAt?: Date;
}

export class SSOService {
  /**
   * Generate SSO key
   */
  private generateSSOKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate SSO key for identification
   */
  private generateSSOKeyIdentifier(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Create SSO session
   */
  async createSSO(data: CreateSSOData) {
    const { url, userId, deviceIP, expiresAt } = data;
    
    const key = this.generateSSOKey();
    const ssoKey = this.generateSSOKeyIdentifier();
    
    const sso = await prisma.sSO.create({
      data: {
        url,
        key,
        ssoKey,
        userId,
        deviceIP,
        expiresAt: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours default
        isActive: true
      },
      include: {
        user: {
          select: { id: true, email: true, nickname: true }
        }
      }
    });
    
    return sso;
  }

  /**
   * Get SSO by key
   */
  async getSSOByKey(key: string) {
    return await prisma.sSO.findUnique({
      where: { key },
      include: {
        user: {
          select: { id: true, email: true, nickname: true, status: true }
        }
      }
    });
  }

  /**
   * Get SSO by SSO key
   */
  async getSSOBySSOKey(ssoKey: string) {
    return await prisma.sSO.findUnique({
      where: { ssoKey },
      include: {
        user: {
          select: { id: true, email: true, nickname: true, status: true }
        }
      }
    });
  }

  /**
   * Get SSO by ID
   */
  async getSSOById(id: string) {
    return await prisma.sSO.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, nickname: true }
        },
        loginHistory: {
          orderBy: { loginAt: 'desc' },
          take: 10
        }
      }
    });
  }

  /**
   * Update SSO
   */
  async updateSSO(id: string, data: UpdateSSOData) {
    return await prisma.sSO.update({
      where: { id },
      data,
      include: {
        user: {
          select: { id: true, email: true, nickname: true }
        }
      }
    });
  }

  /**
   * Delete SSO
   */
  async deleteSSO(id: string) {
    return await prisma.sSO.delete({
      where: { id }
    });
  }

  /**
   * Get user SSO sessions
   */
  async getUserSSOs(userId: string, page: number = 1, limit: number = 20, isActive?: boolean) {
    const skip = (page - 1) * limit;
    
    const where: any = { userId };
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [ssos, total] = await Promise.all([
      prisma.sSO.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          url: true,
          ssoKey: true,
          deviceIP: true,
          isActive: true,
          expiresAt: true,
          createdAt: true,
          updatedAt: true,
          // Don't include the actual key for security
          key: false,
          user: {
            select: { id: true, email: true, nickname: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.sSO.count({ where })
    ]);

    return {
      data: ssos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Validate SSO session
   */
  async validateSSO(key: string): Promise<{
    isValid: boolean;
    sso?: any;
    reason?: string;
  }> {
    const sso = await this.getSSOByKey(key);
    
    if (!sso) {
      return { isValid: false, reason: 'Invalid SSO key' };
    }
    
    if (!sso.isActive) {
      return { isValid: false, reason: 'SSO session is inactive' };
    }
    
    if (sso.expiresAt && new Date() > sso.expiresAt) {
      // Automatically deactivate expired session
      await this.updateSSO(sso.id, { isActive: false });
      return { isValid: false, reason: 'SSO session has expired' };
    }
    
    return { isValid: true, sso };
  }

  /**
   * Deactivate SSO session
   */
  async deactivateSSO(id: string) {
    return await this.updateSSO(id, { isActive: false });
  }

  /**
   * Deactivate all user SSO sessions
   */
  async deactivateAllUserSSOs(userId: string) {
    return await prisma.sSO.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false }
    });
  }

  /**
   * Record login history for SSO
   */
  async recordLogin(ssoId: string, deviceIP?: string, userAgent?: string, location?: string) {
    const sso = await prisma.sSO.findUnique({
      where: { id: ssoId }
    });
    
    if (!sso) {
      throw new Error('SSO session not found');
    }
    
    return await prisma.loginHistory.create({
      data: {
        ssoId,
        userId: sso.userId,
        deviceIP,
        userAgent,
        location,
        status: 'active'
      }
    });
  }

  /**
   * Record logout for SSO
   */
  async recordLogout(ssoId: string) {
    // Find the active login history record
    const activeLogin = await prisma.loginHistory.findFirst({
      where: {
        ssoId,
        status: 'active'
      },
      orderBy: { loginAt: 'desc' }
    });
    
    if (activeLogin) {
      await prisma.loginHistory.update({
        where: { id: activeLogin.id },
        data: {
          logoutAt: new Date(),
          status: 'logged_out'
        }
      });
    }
    
    // Deactivate the SSO session
    await this.deactivateSSO(ssoId);
  }

  /**
   * Get SSO login history
   */
  async getSSOLoginHistory(ssoId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const [history, total] = await Promise.all([
      prisma.loginHistory.findMany({
        where: { ssoId },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, nickname: true }
          }
        },
        orderBy: { loginAt: 'desc' }
      }),
      prisma.loginHistory.count({ where: { ssoId } })
    ]);
    
    return {
      data: history,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Clean up expired SSO sessions
   */
  async cleanupExpiredSSOs() {
    const result = await prisma.sSO.updateMany({
      where: {
        expiresAt: {
          lt: new Date()
        },
        isActive: true
      },
      data: {
        isActive: false
      }
    });
    
    return result.count;
  }

  /**
   * Get SSO statistics
   */
  async getSSOStats() {
    const [
      totalSSOs,
      activeSSOs,
      expiredSSOs,
      recentLogins
    ] = await Promise.all([
      prisma.sSO.count(),
      prisma.sSO.count({
        where: {
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        }
      }),
      prisma.sSO.count({
        where: {
          OR: [
            { isActive: false },
            {
              expiresAt: {
                lt: new Date()
              }
            }
          ]
        }
      }),
      prisma.loginHistory.count({
        where: {
          loginAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ]);
    
    return {
      total: totalSSOs,
      active: activeSSOs,
      expired: expiredSSOs,
      recentLogins
    };
  }

  /**
   * Refresh SSO session (extend expiry)
   */
  async refreshSSO(id: string, extensionHours: number = 24) {
    const newExpiryDate = new Date(Date.now() + extensionHours * 60 * 60 * 1000);
    
    return await this.updateSSO(id, {
      expiresAt: newExpiryDate,
      isActive: true
    });
  }
}

export const ssoService = new SSOService();