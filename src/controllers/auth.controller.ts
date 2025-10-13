import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import redis from 'redis';
import { DATABASE_URL, REDIS_URL } from '../env';
const prisma = new PrismaClient();
const redisClient = redis.createClient({ url: REDIS_URL });
redisClient.connect();

// Helper: cache token in Redis
async function cacheToken(token: string, userId: string, expiresIn: number) {
  await redisClient.set(`token:${token}`, userId, { EX: expiresIn });
}

export async function login(req: Request, res: Response) {
  // Example login logic
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  // Generate tokens (access/refresh)
  const accessToken = `access_${user.id}_${Date.now()}`;
  const refreshToken = `refresh_${user.id}_${Date.now()}`;
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
  // Check Redis cache first
  const userId = await redisClient.get(`token:${token}`);
  if (userId) {
    return res.json({ valid: true, userId });
  }
  // Fallback to DB
  const dbToken = await prisma.token.findUnique({ where: { accessToken: token } });
  if (dbToken) {
    // Optionally re-cache
    await cacheToken(token, dbToken.userId, 3600);
    return res.json({ valid: true, userId: dbToken.userId });
  }
  res.json({ valid: false });
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
