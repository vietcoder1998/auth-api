import { Router } from 'express';

import { getTokens, grantToken, revokeToken, createToken } from '../controllers/token.controller';

const router = Router();

router.get('', getTokens);
router.post('', createToken);
router.post('/revoke', revokeToken);
router.post('/grant', grantToken);

export default router;
