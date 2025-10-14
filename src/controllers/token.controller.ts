import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { client } from '../setup';
import { generateToken, generateRefreshToken } from '../service/auth.service';
const prisma = new PrismaClient();

export async function revokeToken(req: Request, res: Response) {
  const { token } = req.body;
  try {
    await prisma.token.deleteMany({ where: { accessToken: token } });
    await client.del(`token:${token}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to revoke token' });
  }
}

export async function getTokens(req: Request, res: Response) {
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
    const tokens = await prisma.token.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
            roleId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: Number(limit)
    });

    // Get total count
    const total = await prisma.token.count({ where: whereClause });

    res.json({
      data: tokens,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    console.error('Get tokens error:', err);
    res.status(500).json({ error: 'Failed to get tokens' });
  }
}

export async function getToken(req: Request, res: Response) {
  const { tokenId } = req.params;
  try {
    const token = await prisma.token.findUnique({
      where: { id: tokenId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
            roleId: true
          }
        }
      }
    });

    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    // Check if token is expired
    const isExpired = token.expiresAt < new Date();
    
    res.json({
      ...token,
      isExpired,
      status: isExpired ? 'expired' : 'active'
    });
  } catch (err) {
    console.error('Get token error:', err);
    res.status(500).json({ error: 'Failed to get token' });
  }
}

export async function grantToken(req: Request, res: Response) {
  const { userId } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const accessToken = generateToken({ userId: user.id, email: user.email, role: user.roleId || undefined });
    const refreshToken = generateRefreshToken({ userId: user.id });
    await prisma.token.create({
      data: {
        userId: user.id,
        accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 3600 * 1000)
      }
    });
    await client.set(`token:${accessToken}`, user.id, { EX: 3600 });
    res.json({ accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: 'Failed to grant token' });
  }
}
