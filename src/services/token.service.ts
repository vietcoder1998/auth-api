import jwt from 'jsonwebtoken';
import { CreateTokenData, TokenDro, TokenDto, TokenModel, TokenPayload } from '../interfaces';
import { TokenRepository, tokenRepository, UserRepository, userRepository } from '../repositories';
import { BaseService } from './base.service';

export class TokenService extends BaseService<TokenModel, TokenDto, TokenDro> {
  private jwtSecret: string;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;
  private tokenRepository: TokenRepository;
  private userRepository: UserRepository;

  constructor(tokenRepository: TokenRepository, userRepository: UserRepository) {
    super(tokenRepository);
    this.tokenRepository = tokenRepository;
    this.userRepository = userRepository;
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret';
    this.accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY || '1h';
    this.refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY || '7d';
  }
  /**
   * Generate JWT tokens
   */
  public generateTokens(payload: TokenPayload): { accessToken: string; refreshToken: string } {
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
  public verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.jwtSecret) as TokenPayload;
    } catch (error) {
      return null;
    }
  }
  // Create token record in database
  public async createToken(data: CreateTokenData) {
    const user = await this.userRepository.findUnique({
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
    return this.tokenRepository.findById(token.id, {
      include: { user: { select: { id: true, email: true, nickname: true, status: true } } },
    });
  }
  // Get token by access token
  public async getTokenByAccessToken(accessToken: string): Promise<TokenDro | null> {
    const token = await this.tokenRepository.findByAccessToken(accessToken);
    if (!token) return null;
    return this.tokenRepository.findById(token?.id, {
      include: {
        user: { select: { id: true, email: true, nickname: true, status: true, roleId: true } },
      },
    });
  }

  // Get token by refresh token
  public async getTokenByRefreshToken(refreshToken: string): Promise<TokenDro | null> {
    const token = await this.tokenRepository.findByRefreshToken(refreshToken);
    if (!token) return null;
    return this.tokenRepository.findById((token as any).id, {
      include: {
        user: { select: { id: true, email: true, nickname: true, status: true, roleId: true } },
      },
    });
  }

  // Refresh access token
  public async refreshAccessToken(refreshToken: string) {
    const tokenRecord: TokenDro | null = await this.getTokenByRefreshToken(refreshToken);
    if (!tokenRecord || !tokenRecord.user) {
      throw new Error('Invalid refresh token');
    }
    if (tokenRecord.expiresAt && new Date() > tokenRecord.expiresAt) {
      throw new Error('Refresh token has expired');
    }
    // Generate new access token
    const payload: TokenPayload = {
      userId: tokenRecord.user.id ?? '',
      email: tokenRecord.user.email ?? '',
      roleId: tokenRecord.user.roleId || undefined,
    };
    const { accessToken: newAccessToken } = this.generateTokens(payload);
    // Update token record
    return this.tokenRepository.update(tokenRecord.id, { accessToken: newAccessToken });
  }

  // Revoke token
  public async revokeToken(tokenId: string) {
    return this.tokenRepository.delete(tokenId);
  }

  // Revoke all user tokens
  public async revokeAllUserTokens(userId: string) {
    return this.tokenRepository.deleteMany({ userId });
  }

  // Get user tokens
  public async getUserTokens(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [tokens, total] = await Promise.all([
      this.tokenRepository.findMany({
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
      this.tokenRepository.count({ where: { userId } }),
    ]);
    return {
      data: tokens,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Validate token and get user
  public async validateTokenAndGetUser(accessToken: string) {
    // First try to get from database
    const tokenRecord: TokenDro | null = await this.getTokenByAccessToken(accessToken);
    if (!tokenRecord || !tokenRecord?.user) {
      // If not in database, try to verify JWT directly
      const payload = this.verifyToken(accessToken);
      if (!payload) {
        return null;
      }
      // Get user from payload
      return this.userRepository.findUnique({
        where: { id: payload.userId },
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
        },
      });
    }
    // Check if token is expired
    if (tokenRecord?.expiresAt && new Date() > tokenRecord.expiresAt) {
      // Clean up expired token
      if (tokenRecord.id) await this.revokeToken(tokenRecord.id);
      return null;
    }
    // Get full user details
    return this.userRepository.findUnique({
      where: { id: tokenRecord.userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });
  }

  // Clean up expired tokens
  public async cleanupExpiredTokens() {
    const result = await this.tokenRepository.deleteMany({
      expiresAt: {
        lt: new Date(),
      },
    });
    if (typeof result === 'object' && result !== null && 'count' in result) {
      return (result as { count: number }).count;
    }
    return result as number;
  }

  public async findUnique(args: any): Promise<TokenDro | null> {
    return this.tokenRepository.findUnique(args);
  }
  // Get token statistics
  public async getTokenStats() {
    const [totalTokens, activeTokens, expiredTokens] = await Promise.all([
      this.tokenRepository.count(),
      this.tokenRepository.count({ where: { expiresAt: { gt: new Date() } } }),
      this.tokenRepository.count({ where: { expiresAt: { lt: new Date() } } }),
    ]);
    return {
      total: totalTokens,
      active: activeTokens,
      expired: expiredTokens,
    };
  }

  async count(args: any): Promise<number> {
    const result = await this.tokenRepository.count(args);
 
    return result as number;
  }
}

export const tokenService = new TokenService(tokenRepository, userRepository);
