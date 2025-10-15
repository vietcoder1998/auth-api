import { Router } from 'express';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../middlewares/logger.middle';
import { ssoKeyValidation, requireSSO } from '../middlewares/sso.middleware';
import { HistoryService } from '../services/history.service';

const router = Router();
const prisma = new PrismaClient();

// SSO Login endpoint - validates SSO key and creates login history
router.post('/login', ssoKeyValidation, requireSSO, async (req: Request, res: Response) => {
  try {
    const { deviceIP, userAgent, location } = req.body;
    const sso = req.sso!;

    console.log('[SSO_AUTH] Processing SSO login for user:', sso.user?.email);

    // Create login history entry
    const loginHistory = await prisma.loginHistory.create({
      data: {
        ssoId: sso.id,
        userId: sso.userId,
        deviceIP: deviceIP || req.ip || sso.deviceIP,
        userAgent: userAgent || req.headers['user-agent'],
        location: location || 'Unknown',
        status: 'active',
        loginAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
            roleId: true,
          },
        },
        sso: {
          select: {
            id: true,
            url: true,
            key: true,
          },
        },
      },
    });

    // Log the SSO login action in logic history
    await HistoryService.recordUserAction(sso.userId, 'sso_login', req, {
      entityType: 'SSO',
      entityId: sso.id,
      newValues: {
        sso_url: sso.url,
        login_time: new Date(),
        device_ip: deviceIP || req.ip || sso.deviceIP,
        location: location || 'Unknown',
      },
      notificationTemplateName: 'user_login',
    });

    logger.info('SSO login successful', {
      ssoId: sso.id,
      userId: sso.userId,
      userEmail: sso.user?.email,
      loginHistoryId: loginHistory.id,
      service: 'auth-api',
    });

    res.json({
      success: true,
      message: 'SSO login successful',
      data: {
        loginHistory,
        sso: {
          id: sso.id,
          url: sso.url,
          userId: sso.userId,
        },
        user: sso.user,
      },
    });
  } catch (error) {
    console.error('[SSO_AUTH] Error during SSO login:', error);
    logger.error('SSO login error', { error, service: 'auth-api' });
    res.status(500).json({ error: 'SSO login failed' });
  }
});

// SSO Logout endpoint
router.post('/logout', ssoKeyValidation, requireSSO, async (req: Request, res: Response) => {
  try {
    const sso = req.sso!;
    const { loginHistoryId } = req.body;

    console.log('[SSO_AUTH] Processing SSO logout for user:', sso.user?.email);

    // Update login history to mark as logged out
    if (loginHistoryId) {
      await prisma.loginHistory.updateMany({
        where: {
          id: loginHistoryId,
          ssoId: sso.id,
          status: 'active',
        },
        data: {
          status: 'logged_out',
          logoutAt: new Date(),
        },
      });
    } else {
      // If no specific login history ID provided, log out all active sessions for this SSO
      await prisma.loginHistory.updateMany({
        where: {
          ssoId: sso.id,
          status: 'active',
        },
        data: {
          status: 'logged_out',
          logoutAt: new Date(),
        },
      });
    }

    // Log the SSO logout action in logic history
    await HistoryService.recordUserAction(sso.userId, 'sso_logout', req, {
      entityType: 'SSO',
      entityId: sso.id,
      newValues: {
        sso_url: sso.url,
        logout_time: new Date(),
        device_ip: req.ip || sso.deviceIP,
      },
      notificationTemplateName: 'user_logout',
    });

    logger.info('SSO logout successful', {
      ssoId: sso.id,
      userId: sso.userId,
      userEmail: sso.user?.email,
      loginHistoryId,
      service: 'auth-api',
    });

    res.json({
      success: true,
      message: 'SSO logout successful',
    });
  } catch (error) {
    console.error('[SSO_AUTH] Error during SSO logout:', error);
    logger.error('SSO logout error', { error, service: 'auth-api' });
    res.status(500).json({ error: 'SSO logout failed' });
  }
});

// SSO Me endpoint - get current user info via SSO
router.get('/me', ssoKeyValidation, requireSSO, async (req: Request, res: Response) => {
  try {
    const sso = req.sso!;

    // Get full user info with role and permissions
    const user = await prisma.user.findUnique({
      where: { id: sso.userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userInfo = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      status: user.status,
      role: user.role ? {
        id: user.role.id,
        name: user.role.name,
        permissions: user.role.permissions.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          category: p.category,
          route: p.route,
          method: p.method,
        })),
      } : null,
      sso: {
        id: sso.id,
        url: sso.url,
        isActive: sso.isActive,
        expiresAt: sso.expiresAt,
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json(userInfo);
  } catch (error) {
    console.error('[SSO_AUTH] Error getting SSO user info:', error);
    logger.error('SSO me endpoint error', { error, service: 'auth-api' });
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// SSO Key validation endpoint
router.get('/validate', ssoKeyValidation, requireSSO, async (req: Request, res: Response) => {
  try {
    const sso = req.sso!;

    res.json({
      valid: true,
      sso: {
        id: sso.id,
        url: sso.url,
        userId: sso.userId,
        isActive: sso.isActive,
        expiresAt: sso.expiresAt,
      },
      user: sso.user,
    });
  } catch (error) {
    console.error('[SSO_AUTH] Error validating SSO key:', error);
    logger.error('SSO validation endpoint error', { error, service: 'auth-api' });
    res.status(500).json({ error: 'SSO validation failed' });
  }
});

export default router;