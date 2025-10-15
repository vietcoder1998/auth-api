import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger.middle';

const prisma = new PrismaClient();

// Extend Express Request interface to include sso
declare global {
  namespace Express {
    interface Request {
      sso?: {
        id: string;
        url: string;
        key: string;
        userId: string;
        user?: {
          id: string;
          email: string;
          nickname?: string;
          roleId?: string;
        };
        deviceIP?: string;
        isActive: boolean;
        expiresAt?: Date;
      };
    }
  }
}

export async function ssoKeyValidation(req: Request, res: Response, next: NextFunction) {
  try {
    // Check for SSO key in headers
    const ssoKey = req.headers['x-sso-key'] as string;
    
    if (!ssoKey) {
      console.log('[SSO] No SSO key provided in headers');
      return next(); // Continue without SSO authentication
    }

    console.log('[SSO] Validating SSO key:', ssoKey.substring(0, 8) + '...');

    // Find SSO entry by key
    const ssoEntry = await prisma.sSO.findUnique({
      where: { 
        key: ssoKey,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
            roleId: true,
            status: true,
          },
        },
      },
    });

    if (!ssoEntry) {
      console.log('[SSO] Invalid SSO key provided');
      return res.status(401).json({ error: 'Invalid SSO key' });
    }

    // Check if SSO entry is active
    if (!ssoEntry.isActive) {
      console.log('[SSO] SSO entry is inactive');
      return res.status(401).json({ error: 'SSO entry is inactive' });
    }

    // Check if user is active
    if (ssoEntry.user.status !== 'active') {
      console.log('[SSO] User account is not active');
      return res.status(401).json({ error: 'User account is not active' });
    }

    // Check if SSO entry has expired
    if (ssoEntry.expiresAt && ssoEntry.expiresAt < new Date()) {
      console.log('[SSO] SSO entry has expired');
      return res.status(401).json({ error: 'SSO entry has expired' });
    }

    // Store SSO information in request
    req.sso = {
      id: ssoEntry.id,
      url: ssoEntry.url,
      key: ssoEntry.key,
      userId: ssoEntry.userId,
      user: {
        id: ssoEntry.user.id,
        email: ssoEntry.user.email,
        nickname: ssoEntry.user.nickname || undefined,
        roleId: ssoEntry.user.roleId || undefined,
      },
      deviceIP: ssoEntry.deviceIP || undefined,
      isActive: ssoEntry.isActive,
      expiresAt: ssoEntry.expiresAt || undefined,
    };

    // Also store user information for compatibility with existing middleware
    req.user = {
      roles: [], // Will be populated by RBAC middleware if needed
      permissions: [], // Will be populated by RBAC middleware if needed
    };

    console.log('[SSO] SSO validation successful for user:', ssoEntry.user.email);
    
    logger.info('SSO authentication successful', {
      ssoId: ssoEntry.id,
      userId: ssoEntry.userId,
      userEmail: ssoEntry.user.email,
      service: 'auth-api',
    });

    next();
  } catch (error) {
    console.error('[SSO] Error during SSO validation:', error);
    logger.error('SSO validation error', { error, service: 'auth-api' });
    res.status(500).json({ error: 'SSO validation failed' });
  }
}

export async function requireSSO(req: Request, res: Response, next: NextFunction) {
  if (!req.sso) {
    return res.status(401).json({ error: 'SSO authentication required' });
  }
  next();
}

// Middleware to check either JWT or SSO authentication
export async function jwtOrSSOAuth(req: Request, res: Response, next: NextFunction) {
  // If SSO is already validated, continue
  if (req.sso && req.user) {
    console.log('[AUTH] Using SSO authentication');
    return next();
  }

  // If JWT user is already set, continue
  if (req.user) {
    console.log('[AUTH] Using JWT authentication');
    return next();
  }

  // Neither SSO nor JWT authentication found
  console.log('[AUTH] No valid authentication found');
  return res.status(401).json({ error: 'Authentication required (JWT or SSO)' });
}