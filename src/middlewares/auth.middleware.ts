import { Request, Response, NextFunction } from 'express';
import redis from 'redis';
import { REDIS_URL } from '../env';

const redisClient = redis.createClient({ url: REDIS_URL });
redisClient.connect();

export async function redisTokenValidation(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  const userId = await redisClient.get(`token:${token}`);
  if (!userId) return res.status(401).json({ error: 'Invalid or expired token' });
  req.headers['x-user-id'] = userId;
  next();
}
