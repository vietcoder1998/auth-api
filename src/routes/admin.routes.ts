
import { Router } from 'express';
import userRouter from './user.routes';
import roleRouter from './role.routes';
import permissionRouter from './permission.routes';
import tokenRouter from './token.routes';
import notificationTemplateRouter from './notificationTemplate.routes';
import mailTemplateRouter from './mailTemplate.routes';
import mailRouter from './mail.routes';
import ssoRouter from './sso.routes';
import loginHistoryRouter from './loginHistory.routes';
import logicHistoryRouter from './logicHistory.routes';
import cacheRouter from './cache.routes';
import apiKeyRouter from './apiKey.routes';

const router = Router();

router.use('/users', userRouter);
router.use('/roles', roleRouter);
router.use('/permissions', permissionRouter);
router.use('/tokens', tokenRouter);
router.use('/notification-templates', notificationTemplateRouter);
router.use('/mail-templates', mailTemplateRouter);
router.use('/mails', mailRouter);
router.use('/sso', ssoRouter);
router.use('/login-history', loginHistoryRouter);
router.use('/logic-history', logicHistoryRouter);
router.use('/cache', cacheRouter);
router.use('/api-keys', apiKeyRouter);

export default router;
