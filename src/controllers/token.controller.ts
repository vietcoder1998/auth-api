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
