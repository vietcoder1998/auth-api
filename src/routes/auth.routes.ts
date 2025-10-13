import { Router } from 'express';
import { handoverUserStatus, login, register, validate } from '../controllers/auth.controller';
import { loggerMiddleware } from '../middlewares/logger.middle';
import { client } from '../setup';
import { NextFunction, Request, Response } from 'express';

const router = Router();
router.use(loggerMiddleware);
// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Auth API is healthy' });
});



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
