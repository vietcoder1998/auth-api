import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger.middle';
import { extractAndValidateSSOKey } from '../utils/ssoValidation';

const prisma = new PrismaClient();

// Extend Express Request interface to include sso
declare global {
  namespace Express {
    interface Request {
      sso?: {
        id: string;
        url: string;
        key: string;
        ssoKey?: string;
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
    // Extract and validate SSO key from headers
    const validation = await extractAndValidateSSOKey(req.headers);
    
    if (!validation.ssoKey) {
      console.log('[SSO] No SSO key provided in headers');
      return next(); // Continue without SSO authentication
    }

    console.log('[SSO] Validating SSO key:', validation.ssoKey.substring(0, 8) + '...');

    if (!validation.valid) {
      console.log(`[SSO] SSO validation failed: ${validation.error}`);
      return res.status(401).json({ error: validation.error || 'Invalid SSO key' });
    }

    const ssoEntry = validation.ssoEntry;
    console.log(`[SSO] SSO entry found via ${validation.matchedKeyType}:`, ssoEntry.id);

    // Store SSO information in request
    req.sso = {
      id: ssoEntry.id,
      url: ssoEntry.url,
      key: ssoEntry.key,
      ssoKey: ssoEntry.ssoKey || undefined,
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