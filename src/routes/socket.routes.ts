import { Router } from 'express';
import {
  getAllSockets,
  getSocketById,
  createSocket,
  updateSocket,
  deleteSocket,
  getSocketEvents,
  createSocketEvent,
  deleteSocketEvent,
  addUserToSocketEvent,
} from '../controllers/socket.controller';

const router = Router();

router.get('/', getAllSockets);
router.get('/:id', getSocketById);
router.post('/', createSocket);
router.put('/:id', updateSocket);
router.delete('/:id', deleteSocket);
router.get('/:socketConfigId/events', getSocketEvents);
router.post('/:socketConfigId/events', createSocketEvent);
router.delete('/events/:id', deleteSocketEvent);
router.post('/:socketConfigId/add-user', addUserToSocketEvent);

export default router;
