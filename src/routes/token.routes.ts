import { Router } from 'express';

import { grantToken, revokeToken } from '../controllers/token.controller';

const router = Router();

router.post('/revoke', revokeToken);
router.post('/grant', grantToken);

export default router;
