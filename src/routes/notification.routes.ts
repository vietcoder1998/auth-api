import { Router } from 'express';
import {
  createNotification,
  getNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  pushNotification,
} from '../controllers/notification.controller';

const router = Router();

router.post('/', createNotification);
router.get('/', getNotifications);
router.get('/:id', getNotificationById);
router.put('/:id', updateNotification);
router.delete('/:id', deleteNotification);
router.post('/push', pushNotification);

export default router;
