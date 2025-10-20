import { Router } from 'express';
import {
  getLogicHistory,
  getLogicHistoryById,
  createLogicHistory,
  updateLogicHistory,
  deleteLogicHistory,
  markNotificationSent,
  getLogicHistoryStats,
} from '../controllers/logicHistory.controller';

const router = Router();

// Get all logic history entries with pagination and filtering
router.get('/', getLogicHistory);

// Get logic history statistics
router.get('/stats', getLogicHistoryStats);

// Get specific logic history entry by ID
router.get('/:id', getLogicHistoryById);

// Create new logic history entry
router.post('/', createLogicHistory);

// Update logic history entry
router.put('/:id', updateLogicHistory);

// Delete logic history entry
router.delete('/:id', deleteLogicHistory);

// Mark notification as sent
router.patch('/:id/notification-sent', markNotificationSent);

export default router;
