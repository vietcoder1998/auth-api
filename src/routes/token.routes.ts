import { Router } from 'express';

import { getTokens, grantToken, revokeToken } from '../controllers/token.controller';

const router = Router();

router.post('/revoke', revokeToken);
router.post('/grant', grantToken);
router.get('/', getTokens);

export default router;
