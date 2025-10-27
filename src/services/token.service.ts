import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { BaseService } from './base.service';
import { TokenRepository } from '../repositories/token.repository';
import { TokenDto } from '../interfaces';

const prisma = new PrismaClient();

export interface CreateTokenData {
  userId: string;
  expiresAt: Date;
}

export interface TokenPayload {
  userId: string;
  email: string;
  roleId?: string;
}

export class TokenService extends BaseService<any, TokenDto, TokenDto> {
  private jwtSecret: string;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;
  private tokenRepository: TokenRepository;

  constructor() {
    const tokenRepository = new TokenRepository();
    super(tokenRepository);
    this.tokenRepository = tokenRepository;
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret';
    this.accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY || '1h';
    this.refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY || '7d';
  }
  /**
   * Generate JWT tokens
   */
  generateTokens(payload: TokenPayload): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiry,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.refreshTokenExpiry,
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.jwtSecret) as TokenPayload;
    } catch (error) {
      return null;
    }
  }
  /**
   * Create token record in database
   */
  async createToken(data: CreateTokenData) {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true, email: true, roleId: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId || undefined,
    };

    const { accessToken, refreshToken } = this.generateTokens(payload);

    const token: any = await this.tokenRepository.create({
      userId: data.userId,
      accessToken,
      refreshToken,
      expiresAt: data.expiresAt,
      refreshExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    } as any);

    // Get with user relation
    return prisma.token.findUnique({
      where: { id: token.id },
      include: {
        user: {
          select: { id: true, email: true, nickname: true, status: true },
        },
      },
    });
  }
  /**
   * Get token by access token
   */
  async getTokenByAccessToken(accessToken: string) {
    const token = await this.tokenRepository.findByAccessToken(accessToken);
    if (!token) return null;
    
    return prisma.token.findUnique({
      where: { id: (token as any).id },
      include: {
        user: {
          select: { id: true, email: true, nickname: true, status: true, roleId: true },
        },
      },
    });
  }

  /**
   * Get token by refresh token
   */
  async getTokenByRefreshToken(refreshToken: string) {
    const token = await this.tokenRepository.findByRefreshToken(refreshToken);
    if (!token) return null;
    
    return prisma.token.findUnique({
      where: { id: (token as any).id },
      include: {
        user: {
          select: { id: true, email: true, nickname: true, status: true, roleId: true },
        },
      },
    });
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string) {
    const tokenRecord = await this.getTokenByRefreshToken(refreshToken);

    if (!tokenRecord) {
      throw new Error('Invalid refresh token');
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new Error('Refresh token has expired');
    }

    // Generate new access token
    const payload: TokenPayload = {
      userId: tokenRecord.user.id,
      email: tokenRecord.user.email,
      roleId: tokenRecord.user.roleId || undefined,
    };

    const { accessToken: newAccessToken } = this.generateTokens(payload);

    // Update token record
    const updatedToken = await prisma.token.update({
      where: { id: tokenRecord.id },
      data: { accessToken: newAccessToken },
      include: {
        user: {
          select: { id: true, email: true, nickname: true, status: true },
        },
      },
    });

    return updatedToken;
  }

  /**
   * Revoke token
   */
  async revokeToken(tokenId: string) {
    return await prisma.token.delete({
      where: { id: tokenId },
    });
  }

  /**
   * Revoke all user tokens
   */
  async revokeAllUserTokens(userId: string) {
    return await prisma.token.deleteMany({
      where: { userId },
    });
  }

  /**
   * Get user tokens
   */
  async getUserTokens(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [tokens, total] = await Promise.all([
      prisma.token.findMany({
        where: { userId },
        skip,
        take: limit,
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
          accessToken: false, // Don't return actual tokens for security
          refreshToken: false,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.token.count({ where: { userId } }),
    ]);

    return {
      data: tokens,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Validate token and get user
   */
  async validateTokenAndGetUser(accessToken: string) {
    // First try to get from database
    const tokenRecord = await this.getTokenByAccessToken(accessToken);

    if (!tokenRecord) {
      // If not in database, try to verify JWT directly
      const payload = this.verifyToken(accessToken);
      if (!payload) {
        return null;
      }

      // Get user from payload
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
        },
      });

      return user;
    }

    // Check if token is expired
    if (new Date() > tokenRecord.expiresAt) {
      // Clean up expired token
      await this.revokeToken(tokenRecord.id);
      return null;
    }

    // Get full user details
    const user = await prisma.user.findUnique({
      where: { id: tokenRecord.userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    return user;
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens() {
    const result = await prisma.token.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  /**
   * Get token statistics
   */
  async getTokenStats() {
    const [totalTokens, activeTokens, expiredTokens] = await Promise.all([
      prisma.token.count(),
      prisma.token.count({
        where: {
          expiresAt: {
            gt: new Date(),
          },
        },
      }),
      prisma.token.count({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      }),
    ]);

    return {
      total: totalTokens,
      active: activeTokens,
      expired: expiredTokens,
    };
  }
}

export const tokenService = new TokenService();
