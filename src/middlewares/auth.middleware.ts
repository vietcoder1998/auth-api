import { NextFunction, Request, Response } from 'express';
import { HEADER_AUTHORIZATION, HEADER_X_USER_ID } from '../env';
import { AuthService, authService } from '../services/auth.service';
import { TokenService, tokenService } from '../services/token.service';
import { UserService, userService } from '../services/user.service';
import { CacheMiddleware, cacheMiddleware } from './cache.middleware';

export class AuthMiddleware {
  private cacheMiddleware: CacheMiddleware;
  public authService: AuthService;

  constructor() {
    this.cacheMiddleware = cacheMiddleware;
    this.authService = authService;
  }
  async redisTokenValidation(request: Request, response: Response, next: NextFunction) {
    const token = request.headers[HEADER_AUTHORIZATION]?.toString().replace('Bearer ', '');
    if (!token) return response.status(401).json({ error: 'No token provided' });
    const userId = await this.cacheMiddleware.getUserIdByToken(token);
    if (!userId) return response.status(401).json({ error: 'Invalid or expired token' });
    request.headers[HEADER_X_USER_ID] = userId;
    next();
  }

  async jwtTokenValidation(request: Request, response: Response, next: NextFunction) {
    try {
      if (
        request.originalUrl?.includes('/api/auth') &&
        !request.originalUrl?.includes('/api/auth/me')
      ) {
        return next();
      }

      // If SSO authentication is already successful, skip JWT validation
      if (request.sso && request.user) {
        console.log('[JWT] Skipping JWT validation - SSO already authenticated');
        return next();
      }

      const token = request.headers[HEADER_AUTHORIZATION]?.toString().replace('Bearer ', '');
      if (!token) {
        throw { status: 401, error: 'No token provided' };
      }

      const decoded = authService.validateToken(token);

      if (!decoded?.userId) {
        throw { status: 401, error: 'Invalid token format' };
      }

      // Check if token exists in database and is not expired
      const tokenRecord = await tokenService.findUnique({
        where: { accessToken: token },
        include: { user: true },
      });

      if (!tokenRecord) {
        throw { status: 401, error: 'Token not found in database' };
      }

      if (!tokenRecord?.expiresAt || tokenRecord.expiresAt < new Date()) {
        throw { status: 401, error: 'Token has expired' };
      }

      if (tokenRecord?.user.status !== 'active') {
        throw { status: 401, error: 'User account is not active' };
      }

      // Set user ID in headers for downstream use
      request.headers[HEADER_X_USER_ID] = decoded.userId;

      // Load full user data with roles and permissions
      const fullUser = await userService.findUnique({
        where: { id: decoded.userId },
        include: {
          role: {
            include: { permissions: true },
          },
        },
      });

      // Set user info with roles and permissions for RBAC
      (request as any).user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        roles: fullUser?.role?.name ? [fullUser.role.name] : [],
        permissions: fullUser?.role?.permissions || [],
      };

      next();
    } catch (error: any) {
      // fallback for unexpected errors
      response
        .status(error?.status ?? 500)
        .json({ error: 'Authentication service error' + String(error) });

      return;
    }
  }
}

export const authMiddleware = new AuthMiddleware();
