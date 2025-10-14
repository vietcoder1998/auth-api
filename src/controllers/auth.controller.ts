
import { PrismaClient } from '@prisma/client';
// Update the path below to the correct location of your Redis client setup file
import { client } from '../setup';
import { generateToken, generateRefreshToken, validateToken } from '../service/auth.service';
import { Request, Response } from 'express';
const prisma = new PrismaClient();

// Helper: cache token in Redis
async function cacheToken(token: string, userId: string, expiresIn: number) {
  await client.set(`token:${token}`, userId, { EX: expiresIn });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  // Generate JWT tokens
    const accessToken = generateToken({
      userId: user.id,
      email: user.email,
      ...(user.roleId ? { role: user.roleId } : {})
    });
  const refreshToken = generateRefreshToken({ userId: user.id });
  // Save tokens in DB
  await prisma.token.create({
    data: {
      userId: user.id,
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
    },
  });
  // Cache access token in Redis
  await cacheToken(accessToken, user.id, 3600);
  res.json({ accessToken, refreshToken });
}

export async function register(req: Request, res: Response) {
  const { email, password, nickname } = req.body;
  const user = await prisma.user.create({
    data: { email, password, nickname },
  });
  res.json({ user });
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
                description: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Super admin: handover user status
export async function handoverUserStatus(req: Request, res: Response) {
  const { userId, newStatus } = req.body;
  // Only allow if requester is super admin (role check)
  // Example: get requesterId from a header (replace with JWT auth in production)
  const requesterId = req.headers['x-user-id'] as string;
  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
    include: { role: true },
  });

  if (!requester || requester.role?.name !== 'superadmin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const user = await prisma.user.update({ where: { id: userId }, data: { status: newStatus } });
  res.json({ user });
}
