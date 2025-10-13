import { Router } from 'express';
import { login, register, validate, handoverUserStatus } from '../controllers/auth.controller';
const router = Router();

// Middleware to check token from Redis cache
import { REDIS_URL } from '../env';
import redis from 'redis';
const redisClient = redis.createClient({ url: REDIS_URL });
redisClient.connect();

import { Request, Response, NextFunction } from 'express';

async function tokenCacheMiddleware(req: Request, res: Response, next: NextFunction) {
	const token = req.headers['authorization']?.replace('Bearer ', '');
	if (!token) return res.status(401).json({ error: 'No token provided' });
	const userId = await redisClient.get(`token:${token}`);
	if (!userId) return res.status(401).json({ error: 'Invalid or expired token' });
	req.headers['x-user-id'] = userId;
	next();
}

router.post('/login', login);
router.post('/register', register);
router.post('/validate', validate);
router.post('/handover-user-status', tokenCacheMiddleware, handoverUserStatus);

export default router;
