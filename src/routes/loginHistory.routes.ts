import { Router } from 'express';
import {
  getLoginHistory,
  getLoginHistoryById,
  createLoginHistory,
  updateLoginHistory,
  deleteLoginHistory,
  logoutUser,
  getLoginStats,
} from '../controllers/loginHistory.controller';

const router = Router();

// Get all login history entries with pagination and filtering
router.get('/', getLoginHistory);

// Get login statistics
router.get('/stats', getLoginStats);

// Get specific login history entry by ID
router.get('/:id', getLoginHistoryById);

// Create new login history entry
router.post('/', createLoginHistory);

// Update login history entry
router.put('/:id', updateLoginHistory);

// Delete login history entry
router.delete('/:id', deleteLoginHistory);

// Log out user (mark as logged out)
router.patch('/:id/logout', logoutUser);

export default router;
