import { Router } from 'express';
import userRouter from './user.routes';
import roleRouter from './role.routes';
import permissionRouter from './permission.routes';
import tokenRouter from './token.routes';
import notificationTemplateRouter from './notificationTemplate.routes';
import notificationRouter from './notification.routes';
import mailTemplateRouter from './mailTemplate.routes';
import mailRouter from './mail.routes';
import ssoRouter from './sso.routes';
import loginHistoryRouter from './loginHistory.routes';
import logicHistoryRouter from './logicHistory.routes';
import cacheRouter from './cache.routes';
import apiKeyRouter from './apiKey.routes';
import agentRouter from './agent.routes';
import conversationRouter from './conversation.routes';
import labelRouter from './label.routes';
import seedRouter from './seed.routes';
import loggerRouter from './logger.routes';
import databaseConnectionRouter from './database-connection.routes';
import socketRoutes from './socket.routes';
import documentRouter from './document.routes';
import faqRouter from './faq.routes';
import promptHistoryRouter from './promptHistory.routes';
import uiConfigRouter from './uiconfig.routes';
import jobRouter from './job.routes';
import { searchAllEntities } from '../controllers/search.controller';
import {
  upload,
  uploadFile,
  getFile,
  deleteFile,
  downloadDocument,
} from '../controllers/file.controller';

const router = Router();

router.use('/users', userRouter);
router.use('/roles', roleRouter);
router.use('/permissions', permissionRouter);
router.use('/tokens', tokenRouter);
router.use('/notification-templates', notificationTemplateRouter);
router.use('/notifications', notificationRouter);
router.use('/mail-templates', mailTemplateRouter);
router.use('/mails', mailRouter);
router.use('/sso', ssoRouter);
router.use('/login-history', loginHistoryRouter);
router.use('/logic-history', logicHistoryRouter);
router.use('/cache', cacheRouter);
router.use('/api-keys', apiKeyRouter);
router.use('/agents', agentRouter);
router.use('/conversations', conversationRouter);
router.use('/labels', labelRouter);
router.use('/seed', seedRouter);
router.use('/logs', loggerRouter);
router.use('/database-connections', databaseConnectionRouter);
router.use('/sockets', socketRoutes);
router.use('/documents', documentRouter);
router.use('/faqs', faqRouter);
router.use('/ui-config', uiConfigRouter);
router.use('/jobs', jobRouter);
router.get('/search', searchAllEntities);
router.post('/files/upload', upload.single('file'), uploadFile);
router.get('/files/:filename', getFile);
router.get('/files/download/:filename', downloadDocument);
router.delete('/files/:filename', deleteFile);
router.use('/prompts', promptHistoryRouter);

export default router;
