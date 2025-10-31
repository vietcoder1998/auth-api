import { Request, Response } from 'express';
import { TokenDro, TokenDto, TokenModel, UserDro } from '../interfaces';
import {
  authService,
  AuthService,
  historyService,
  HistoryService,
  TokenService,
  tokenService,
  UserService,
} from '../services';
import { client } from '../setup';
import { BaseController } from './base.controller';
import { cacheMiddleware, CacheMiddleware } from '../middlewares';

export class TokenController extends BaseController<TokenModel, TokenDto, TokenDro> {
  private tokenService: TokenService;
  private authService: AuthService;
  private historyService: HistoryService;
  private userService: UserService = new UserService();
  private cacheMiddleware: CacheMiddleware = cacheMiddleware;

  constructor(tokenServiceParam?: TokenService) {
    const svc = tokenServiceParam || tokenService;
    super(svc);
    this.tokenService = svc;
    this.authService = authService;
    this.historyService = historyService;
  }

  public async revokeToken(req: Request, res: Response) {
    const { token } = req.body;
    try {
      await this.tokenService.deleteMany({ where: { accessToken: token } });
      await client.del(`token:${token}`);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to revoke token' });
    }
  }

  public async getTokens(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, userId, isExpired } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Build where clause - if no userId provided, returns all tokens
      const whereClause: any = {};

      // Filter by userId if provided, otherwise return all tokens
      if (userId && userId.toString().trim() !== '') {
        whereClause.userId = userId as string;
      }

      // Filter by expiration status if provided
      if (isExpired !== undefined) {
        const now = new Date();
        if (isExpired === 'true') {
          whereClause.expiresAt = { lt: now };
        } else {
          whereClause.expiresAt = { gte: now };
        }
      }

      // Get tokens with pagination
      const tokens = await this.tokenService.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nickname: true,
              roleId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: Number(limit),
      });

      // Get total count
      const total: number = await this.tokenService.count({ where: whereClause });

      res.json({
        data: tokens,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (err) {
      console.error('Get tokens error:', err);
      res.status(500).json({ error: 'Failed to get tokens' });
    }
  }

  public async getToken(req: Request, res: Response) {
    const { tokenId } = req.params;
    try {
      const token = await this.tokenService.findUnique({
        where: { id: tokenId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nickname: true,
              roleId: true,
            },
          },
        },
      });

      if (!token) {
        return res.status(404).json({ error: 'Token not found' });
      }

      // Check if token is expired
      const isExpired = token?.expiresAt ? token.expiresAt < new Date() : undefined;

      res.json({
        ...token,
        isExpired,
        status: isExpired === undefined ? 'unknown' : isExpired ? 'expired' : 'active',
      });
    } catch (err) {
      console.error('Get token error:', err);
      res.status(500).json({ error: 'Failed to get token' });
    }
  }

  public async grantToken(req: Request, res: Response) {
    const { userId } = req.body;
    try {
      // Fetch user entity to get email and role
      const user = await this.userService.findUnique({
        where: { id: userId },
      });

      if (!user) return res.status(404).json({ error: 'User not found' });

      const accessToken = this.authService.generateToken(
        { userId: user.id, email: user.email, role: user.roleId || undefined },
        '1h',
      );

      const refreshToken = this.authService.generateRefreshToken({ userId: user.id }, '7d');
      await this.tokenService.create({
        userId: user.id,
        accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      } as any);
      await client.set(`token:${accessToken}`, user.id, { EX: 3600 });
      res.json({ accessToken, refreshToken });
    } catch (err) {
      res.status(500).json({ error: 'Failed to grant token' });
    }
  }

  public async createToken(req: Request, res: Response) {
    const { userId, ssoId, deviceIP, userAgent, location, expiresIn = '24h' } = req.body;

    try {
      // Validate user exists
      const user: UserDro | null = await this.userService.findUnique({
        where: { id: userId },
        include: {
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Calculate expiration time based on expiresIn
      let expirationMs = 24 * 60 * 60 * 1000; // Default 24 hours
      if (expiresIn.endsWith('h')) {
        expirationMs = parseInt(expiresIn.slice(0, -1)) * 60 * 60 * 1000;
      } else if (expiresIn.endsWith('d')) {
        expirationMs = parseInt(expiresIn.slice(0, -1)) * 24 * 60 * 60 * 1000;
      }

      // Generate tokens
      const accessToken = this.authService.generateToken(
        {
          userId: user?.id ?? '',
          email: user.email,
          role: user.roleId || undefined,
        },
        expiresIn,
      );

      const refreshToken = this.authService.generateRefreshToken({ userId: user?.id ?? '' }, '7d');

      // Create token record
      const tokenRecord = await this.tokenService.create({
        userId: user?.id ?? '',
        accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + expirationMs),
      } as any);

      // Store in cache for fast lookup
      await this.cacheMiddleware.cacheToken(
        accessToken,
        user?.id ?? '',
        Math.floor(expirationMs / 1000),
      );

      // If SSO context, create login history entry
      if (ssoId) {
        try {
          await this.historyService.create({
            userId: user?.id ?? '',
            ssoId: ssoId,
            deviceIP: deviceIP || req.ip || 'Unknown',
            userAgent: userAgent || req.get('User-Agent') || 'Unknown',
            location: location || 'Token Creation',
            status: 'active',
            loginAt: new Date(),
          });
        } catch (loginHistoryError) {
          console.error('Failed to create login history entry:', loginHistoryError);
          // Continue without failing token creation
        }
      }

      res.status(201).json({
        token: accessToken,
        refreshToken,
        expiresAt: tokenRecord.expiresAt,
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          role: user.role,
        },
        metadata: {
          ssoId,
          deviceIP: deviceIP || req.ip,
          location: location || 'Token Creation',
        },
      });
    } catch (error) {
      console.error('Create token error:', error);
      res.status(500).json({ error: 'Failed to create token' });
    }
  }
}

export const tokenController = new TokenController(tokenService);
