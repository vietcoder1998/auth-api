import { Request, Response } from 'express';
import { HEADER_X_USER_ID } from '../env';
import { TokenDro, TokenDto, TokenModel } from '../interfaces';
import { CacheMiddleware, cacheMiddleware } from '../middlewares';
import {
  AuthService,
  authService,
  HistoryService,
  historyService,
  tokenService,
  TokenService,
  userService,
  UserService,
} from '../services';
import { client } from '../setup';
import { BaseController } from './base.controller';

export class AuthController extends BaseController<TokenModel, TokenDto, TokenDro> {
  private authService: AuthService;
  private tokenService: TokenService;
  private userService: UserService;
  private cacheMiddleware: CacheMiddleware;
  private historyService: HistoryService;

  constructor(authService: AuthService, tokenService: TokenService, userService: UserService) {
    super(authService);
    this.tokenService = tokenService;
    this.authService = authService;
    this.userService = userService;
    this.cacheMiddleware = cacheMiddleware;
    this.historyService = historyService;
  }

  // POST /login
  public async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = await this.userService.findUnique({ where: { email } });

      if (!user || user.password !== password) {
        // Record failed login attempt
        if (user) {
          await this.historyService.recordUserAction(user.id, 'login_failed', req, {
            entityType: 'User',
            entityId: user.id,
            newValues: { reason: 'invalid_password', attempt_time: new Date() },
            notificationTemplateName: 'security_alert',
          });
        }
        throw new Error('Invalid credentials');
      }

      // Generate JWT tokens
      const accessToken = this.authService.generateToken(
        {
          userId: user.id,
          email: user.email,
          ...(user.roleId ? { role: user.roleId } : {}),
        },
        '1h',
      );
      const refreshToken = this.authService.generateRefreshToken({ userId: user.id }, '7d');

      // Get expiration dates
      const accessTokenExpiresAt = this.authService.getTokenExpiration(accessToken);
      const refreshTokenExpiresAt = this.authService.getTokenExpiration(refreshToken);

      // Save tokens in DB
      const tokenRecord = await this.tokenService.create({
        userId: user.id,
        accessToken,
        refreshToken,
        expiresAt: accessTokenExpiresAt || new Date(Date.now() + 3600 * 1000),
        refreshExpiresAt: refreshTokenExpiresAt || new Date(Date.now() + 7 * 24 * 3600 * 1000),
      });

      // Cache access token in Redis
      await this.cacheMiddleware.cacheToken(accessToken, user.id, 3600);

      // Cache refresh token in Redis
      if (refreshTokenExpiresAt) {
        const ttl = Math.floor((refreshTokenExpiresAt.getTime() - Date.now()) / 1000);
        if (ttl > 0) {
          await this.cacheMiddleware.cacheToken(refreshToken, user.id, ttl);
        }
      }
      // Record successful login using historyService
      const loginHistory = await this.historyService.recordLogin(user.id, req);

      // Record login logic history
      await this.historyService.recordUserAction(user.id, 'login_successful', req, {
        entityType: 'Token',
        entityId: tokenRecord.id,
        newValues: {
          login_time: new Date(),
          token_expires_at: tokenRecord.expiresAt,
          user_agent: historyService.getUserAgent(req),
          ip_address: historyService.getClientIP(req),
        },
        notificationTemplateName: 'user_login',
      });

      res.json({
        accessToken,
        accessTokenExpiresAt,
        refreshToken,
        refreshTokenExpiresAt,
        loginHistoryId: loginHistory?.id, // Return for potential logout tracking
        user,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /refresh-access-token
  public refreshAccessToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const result = this.authService.generateAccessTokenFromRefreshToken(refreshToken);
      if (!result) {
        throw new Error('Invalid refresh token');
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /register
  public async register(req: Request, res: Response) {
    try {
      const { email, password, nickname } = req.body;

      // Check if user already exists
      const existingUser = await this.userService.findUnique({ where: { email } });
      if (existingUser) {
        throw new Error('User already exists');
      }

      const user = await this.userService.create({ email, password, nickname });

      // Record user registration
      await this.historyService.recordUserAction(user.id, 'user_registered', req, {
        entityType: 'User',
        entityId: user.id,
        newValues: {
          email: user.email,
          nickname: user.nickname,
          registration_time: user.createdAt,
        },
      });

      res.json({ user });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /logout
  public async logout(req: Request, res: Response) {
    try {
      const { loginHistoryId } = req.body;
  const userId = req.headers[HEADER_X_USER_ID] as string;

      if (!userId) {
        throw new Error('User ID not found in request');
      }

      // Get the authorization header to find the token
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      if (token) {
        // Remove token from Redis cache
        await client.del(`token:${token}`);

        // Invalidate token in database
        await this.tokenService.updateMany({  accessToken: token,
            userId: userId,},{
       
            expiresAt: new Date(),
        });
      }
      // Update login history if provided
      if (loginHistoryId) {
        await this.historyService.logoutUser(loginHistoryId);
      } else {
        // Find and update the most recent active session
        const activeSessions = await historyService.getActiveUserSessions(userId);
        if (activeSessions.length > 0) {
          await historyService.logoutUser(activeSessions[0].id);
        }
      }

      // Record logout action
      await historyService.recordUserAction(userId, 'logout', req, {
        entityType: 'Token',
        entityId: token,
        newValues: {
          logout_time: new Date(),
          logout_type: 'manual',
        },
      });

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /validate
  public async validate(req: Request, res: Response) {
    const { token } = req.body;
    // Validate JWT
    const payload = this.authService.validateToken(token);
    if (!payload) {
      return res.json({ valid: false, error: 'Invalid token' });
    }
    // Check Redis cache first
    const userId = await client.get(`token:${token}`);
    if (userId) {
      return res.json({ valid: true, userId, payload });
    }
    // Fallback to DB
    const dbToken = await this.tokenService.findUnique({ where: { accessToken: token } });
    if (dbToken) {
      // Optionally re-cache
      await this.cacheMiddleware.cacheToken(token, dbToken.userId, 3600);
      return res.json({ valid: true, userId: dbToken.userId, payload });
    }
    res.json({ valid: false });
  }

  // GET /me
  public async getMe(req: Request, res: Response) {
    try {
  const userId = req.headers[HEADER_X_USER_ID] as string;

      if (!userId) {
        throw new Error('User ID not found in request');
      }

      const user = await this.userService.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          nickname: true,
          status: true,
          roleId: true,
          createdAt: true,
          role: {
            select: {
              id: true,
              name: true,
              permissions: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  description: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Record profile access (optional, for audit purposes)
      // Only log this if it's not too frequent to avoid spam
      // TODO: Move logicHistory to a service if needed
      const lastAccess = null;
      // Only log if no recent access recorded
      if (!lastAccess) {
        await historyService.recordUserAction(userId, 'profile_accessed', req, {
          entityType: 'User',
          entityId: userId,
          newValues: {
            access_time: new Date(),
            permissions_count: user.role?.permissions?.length || 0,
          },
        });
      }

      res.json(user);
    } catch (error) {
      console.error('Get me error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /handover-user-status
  public async handoverUserStatus(req: Request, res: Response) {
    try {
      const { userId, newStatus } = req.body;
  const requesterId = req.headers[HEADER_X_USER_ID] as string;

      if (!requesterId) {
        throw new Error('User ID not found in request');
      }

      // Get requester info
      const requester = await this.userService.findUnique({
        where: { id: requesterId },
        include: { role: true },
      });

      if (!requester || requester.role?.name !== 'superadmin') {
        throw new Error('Forbidden');
      }

      // Get current user status before update
      const currentUser = await this.userService.findUnique({
        where: { id: userId },
        select: { status: true, email: true, nickname: true },
      });

      if (!currentUser) {
        throw new Error('User not found');
      }

      // Update user status
      const user = await this.userService.update(userId, {
        status: newStatus 
      });
      // Record status change in history
      await this.historyService.recordUserAction(requesterId, 'user_status_changed', req, {
        entityType: 'User',
        entityId: userId,
        oldValues: {
          status: currentUser.status,
          target_user: {
            email: currentUser.email,
            nickname: currentUser.nickname,
          },
        },
        newValues: {
          status: newStatus,
          changed_by: {
            email: requester.email,
            nickname: requester.nickname,
            role: requester.role?.name,
          },
          changed_at: new Date(),
        },
        notificationTemplateName: newStatus === 'suspended' ? 'account_suspended' : undefined,
      });

      // If user is being suspended, force logout all their sessions
      if (newStatus === 'suspended' || newStatus === 'inactive') {
        await historyService.forceLogoutAllSessions(userId);

        // Record forced logout
        await historyService.recordUserAction(requesterId, 'force_logout_all_sessions', req, {
          entityType: 'User',
          entityId: userId,
          newValues: {
            reason: `User status changed to ${newStatus}`,
            forced_by: requester.email,
          },
        });
      }

      res.json({ user });
    } catch (error) {
      console.error('Handover user status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /revoke-refresh-token/:tokenId
  public async revokeRefreshToken(req: Request, res: Response) {
    try {
      const { tokenId } = req.params;
      // Find token record
      const tokenRecord = await this.tokenService.findUnique({ where: { id: tokenId } });
      if (!tokenRecord) {
        throw new Error('Token not found');
      }
      // Invalidate refresh token in DB
      await this.tokenService.update(tokenId, {
        refreshExpiresAt: new Date(),
      });
      // Remove from Redis
      await client.del(`token:${tokenRecord.refreshToken}`);
      res.json({ message: 'Refresh token revoked successfully' });
    } catch (error) {
      console.error('Revoke refresh token error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /generate-access-token-from-refresh
  public async generateAccessTokenFromRefresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      // Validate refresh token
      const tokenRecord: TokenDro | null = await this.tokenService.findUnique({ where: { refreshToken } });

      if (
        !tokenRecord ||
        !tokenRecord.refreshExpiresAt ||
        new Date(tokenRecord.refreshExpiresAt) < new Date()
      ) {
        throw new Error('Invalid or expired refresh token');
      }

      // Generate new access token
      const accessToken = this.authService.generateToken({ userId: tokenRecord.userId }, '1h');
      const accessTokenExpiresAt = this.authService.getTokenExpiration(accessToken);
      // Update DB
      await this.tokenService.update(tokenRecord.id, {
        accessToken,
        expiresAt: accessTokenExpiresAt ?? new Date(Date.now() + 3600 * 1000),
      });
      // Cache new access token
      await this.cacheMiddleware.cacheToken(accessToken, tokenRecord.userId, 3600);
      res.json({ accessToken, accessTokenExpiresAt });
    } catch (error) {
      console.error('Generate access token from refresh error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const authController = new AuthController(authService, tokenService, userService);
