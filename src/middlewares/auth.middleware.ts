import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { client } from '../setup';

const prisma = new PrismaClient();

export async function redisTokenValidation(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  const userId = await client.get(`token:${token}`);
  if (!userId) return res.status(401).json({ error: 'Invalid or expired token' });
  req.headers['x-user-id'] = userId;
  next();
}

export async function jwtTokenValidation(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.originalUrl?.includes('/api/auth') && !req.originalUrl?.includes('/api/auth/me')) {
      return next();
    }
    
    const token = req.headers['authorization']?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded.userId) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    // Check if token exists in database and is not expired
    const tokenRecord = await prisma.token.findUnique({
      where: { accessToken: token },
      include: { user: true }
    });

    if (!tokenRecord) {
      return res.status(401).json({ error: 'Token not found in database' });
    }

    if (tokenRecord.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Token has expired' });
    }

    if (tokenRecord.user.status !== 'active') {
      return res.status(401).json({ error: 'User account is not active' });
    }

    // Set user ID in headers for downstream use
    req.headers['x-user-id'] = decoded.userId;
    
    // Load full user data with roles and permissions
    const fullUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { 
        role: { 
          include: { permissions: true } 
        } 
      }
    });

    // Set user info with roles and permissions for RBAC
    (req as any).user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      roles: fullUser?.role?.name ? [fullUser.role.name] : [],
      permissions: fullUser?.role?.permissions || [],
      impersonatedBy: decoded.impersonatedBy,
      impersonatedAt: decoded.impersonatedAt
    };

    next();
  } catch (error) {
    console.error('JWT validation error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    } else if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token has expired' });
    } else {
      return res.status(500).json({ error: 'Authentication service error' });
    }
  }
}
