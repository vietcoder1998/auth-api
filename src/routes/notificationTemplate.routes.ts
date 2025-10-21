import { Router } from 'express';
import * as notificationTemplateController from '../controllers/notificationTemplate.controller';

const router = Router();

import {
  getNotificationTemplates,
  getNotificationTemplateById,
  createNotificationTemplate,
  updateNotificationTemplate,
  deleteNotificationTemplate,
} from '../controllers/notificationTemplate.controller';

router.get('/', getNotificationTemplates);
router.get('/:id', getNotificationTemplateById);
router.post('/', createNotificationTemplate);
router.put('/:id', updateNotificationTemplate);
router.delete('/:id', deleteNotificationTemplate);

export default router;
