import { PrismaClient } from '@prisma/client';
// Update the path below to the correct location of your Redis client setup file
import { client } from '../setup';
import { generateToken, generateRefreshToken, validateToken, generateAccessTokenFromRefreshToken, getTokenExpiration } from '../services/auth.service';
import { HistoryService } from '../services/history.service';
import { Request, Response } from 'express';
const prisma = new PrismaClient();

// Helper: cache token in Redis
async function cacheToken(token: string, userId: string, expiresIn: number) {
  await client.set(`token:${token}`, userId, { EX: expiresIn });
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.password !== password) {
      // Record failed login attempt
      if (user) {
        await HistoryService.recordUserAction(user.id, 'login_failed', req, {
          entityType: 'User',
          entityId: user.id,
          newValues: { reason: 'invalid_password', attempt_time: new Date() },
          notificationTemplateName: 'security_alert',
        });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT tokens
    const accessToken = generateToken(
      {
        userId: user.id,
        email: user.email,
        ...(user.roleId ? { role: user.roleId } : {}),
      },
      '1h',
    );
    const refreshToken = generateRefreshToken({ userId: user.id }, '7d');

    // Get expiration dates
    const accessTokenExpiresAt = getTokenExpiration(accessToken);
    const refreshTokenExpiresAt = getTokenExpiration(refreshToken);

    // Save tokens in DB
    const tokenRecord = await prisma.token.create({
      data: {
        userId: user.id,
        accessToken,
        refreshToken,
        expiresAt: accessTokenExpiresAt || new Date(Date.now() + 3600 * 1000), // 1 hour fallback
        refreshExpiresAt: refreshTokenExpiresAt || new Date(Date.now() + 7 * 24 * 3600 * 1000), // 7 days fallback
      },
    });

    // Cache access token in Redis
    await cacheToken(accessToken, user.id, 3600);
    // Cache refresh token in Redis
    if (refreshTokenExpiresAt) {
      const ttl = Math.floor((refreshTokenExpiresAt.getTime() - Date.now()) / 1000);
      if (ttl > 0) {
        await cacheToken(refreshToken, user.id, ttl);
      }
    }

    // Record successful login using HistoryService
    const loginHistory = await HistoryService.recordLogin(user.id, req);

    // Record login logic history
    await HistoryService.recordUserAction(user.id, 'login_successful', req, {
      entityType: 'Token',
      entityId: tokenRecord.id,
      newValues: {
        login_time: new Date(),
        token_expires_at: tokenRecord.expiresAt,
        user_agent: HistoryService.getUserAgent(req),
        ip_address: HistoryService.getClientIP(req),
      },
      notificationTemplateName: 'user_login',
    });

    res.json({
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
      loginHistoryId: loginHistory?.id, // Return for potential logout tracking
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Generate new access token from refresh token
export function refreshAccessToken(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    const result = generateAccessTokenFromRefreshToken(refreshToken);
    if (!result) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { email, password, nickname } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = await prisma.user.create({
      data: { email, password, nickname },
    });

    // Record user registration
    await HistoryService.recordUserAction(user.id, 'user_registered', req, {
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

export async function logout(req: Request, res: Response) {
  try {
    const { loginHistoryId } = req.body;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in request' });
    }

    // Get the authorization header to find the token
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      // Remove token from Redis cache
      await client.del(`token:${token}`);

      // Invalidate token in database
      await prisma.token.updateMany({
        where: {
          accessToken: token,
          userId: userId,
        },
        data: {
          expiresAt: new Date(), // Set to expired
        },
      });
    }

    // Update login history if provided
    if (loginHistoryId) {
      await HistoryService.logoutUser(loginHistoryId);
    } else {
      // Find and update the most recent active session
      const activeSessions = await HistoryService.getActiveUserSessions(userId);
      if (activeSessions.length > 0) {
        await HistoryService.logoutUser(activeSessions[0].id);
      }
    }

    // Record logout action
    await HistoryService.recordUserAction(userId, 'logout', req, {
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

export async function validate(req: Request, res: Response) {
  const { token } = req.body;
  // Validate JWT
  const payload = validateToken(token);
  if (!payload) {
    return res.json({ valid: false, error: 'Invalid token' });
  }
  // Check Redis cache first
  const userId = await client.get(`token:${token}`);
  if (userId) {
    return res.json({ valid: true, userId, payload });
  }
  // Fallback to DB
  const dbToken = await prisma.token.findUnique({ where: { accessToken: token } });
  if (dbToken) {
    // Optionally re-cache
    await cacheToken(token, dbToken.userId, 3600);
    return res.json({ valid: true, userId: dbToken.userId, payload });
  }
  res.json({ valid: false });
}

// Get current user information
export async function getMe(req: Request, res: Response) {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in request' });
    }

    const user = await prisma.user.findUnique({
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
      return res.status(404).json({ error: 'User not found' });
    }

    // Record profile access (optional, for audit purposes)
    // Only log this if it's not too frequent to avoid spam
    const lastAccess = await prisma.logicHistory.findFirst({
      where: {
        userId: userId,
        action: 'profile_accessed',
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Only log if no recent access recorded
    if (!lastAccess) {
      await HistoryService.recordUserAction(userId, 'profile_accessed', req, {
        entityType: 'User',
        entityId: userId,
        newValues: {
          access_time: new Date(),
          permissions_count: user.role?.permissions.length || 0,
        },
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Super admin: handover user status
export async function handoverUserStatus(req: Request, res: Response) {
  try {
    const { userId, newStatus } = req.body;
    const requesterId = req.headers['x-user-id'] as string;

    if (!requesterId) {
      return res.status(401).json({ error: 'User ID not found in request' });
    }

    // Get requester info
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      include: { role: true },
    });

    if (!requester || requester.role?.name !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get current user status before update
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true, email: true, nickname: true },
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user status
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: newStatus },
    });

    // Record status change in history
    await HistoryService.recordUserAction(requesterId, 'user_status_changed', req, {
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
      await HistoryService.forceLogoutAllSessions(userId);

      // Record forced logout
      await HistoryService.recordUserAction(requesterId, 'force_logout_all_sessions', req, {
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
