import { Router } from 'express';

import { getTokens, grantToken, revokeToken } from '../controllers/token.controller';

const router = Router();

router.get('', getTokens);
router.post('/revoke', revokeToken);
router.post('/grant', grantToken);

export default router;
