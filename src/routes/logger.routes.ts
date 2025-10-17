import { Router } from 'express';
import {
  getLogs,
  getLogStats,
  clearOldLogs,
  exportLogs,
  createLogEntry
} from '../controllers/logger.controller';

const router = Router();

// GET /api/admin/logs - Get logs with filtering and pagination
router.get('/', getLogs);

// GET /api/admin/logs/stats - Get log statistics
router.get('/stats', getLogStats);

// GET /api/admin/logs/export - Export logs
router.get('/export', exportLogs);

// POST /api/admin/logs - Create a manual log entry
router.post('/', createLogEntry);

// DELETE /api/admin/logs/clear - Clear old logs
router.delete('/clear', clearOldLogs);

export default router;