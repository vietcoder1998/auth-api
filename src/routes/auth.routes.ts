import { Router } from 'express';
import { handoverUserStatus, login, register, validate } from '../controllers/auth.controller';
import { loggerMiddleware } from '../middlewares/logger.middle';

const router = Router();
router.use(loggerMiddleware);
// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Auth API is healthy' });
});

// Middleware to check token from Redis cache
import { client } from '../setup';
import { NextFunction, Request, Response } from 'express';

async function tokenCacheMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const userId = await client.get(`token:${token}`);
    if (!userId) return res.status(401).json({ error: 'Invalid or expired token' });
    req.headers['x-user-id'] = userId;
    next();
}

router.post('/login', login);
router.post('/register', register);
router.post('/validate', validate);
router.post('/handover-user-status', tokenCacheMiddleware, handoverUserStatus);

export default router;
