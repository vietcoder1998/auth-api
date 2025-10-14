
import { Router } from 'express';
import userRouter from './user.routes';
import roleRouter from './role.routes';
import permissionRouter from './permission.routes';
import tokenRouter from './token.routes';
import notificationTemplateRouter from './notificationTemplate.routes';
import cacheRouter from './cache.routes';

const router = Router();

router.use('/users', userRouter);
router.use('/roles', roleRouter);
router.use('/permissions', permissionRouter);
router.use('/tokens', tokenRouter);
router.use('/notification-templates', notificationTemplateRouter);
router.use('/cache', cacheRouter);

export default router;
