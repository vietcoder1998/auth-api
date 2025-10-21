import { Router } from 'express';
import { restartBackend } from '../controllers/system.controller';

const router = Router();

// System: Restart backend app (POST)
router.post('/restart', restartBackend);

export default router;
