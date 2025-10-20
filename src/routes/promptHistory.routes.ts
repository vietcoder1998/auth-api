import { Router } from 'express';
import {
  createPromptHistory,
  getPromptHistories,
  getPromptHistoryById,
  updatePromptHistory,
  deletePromptHistory
} from '../controllers/promptHistory.controller';

const router = Router();

// POST /api/admin/conversations/:conversationId/prompts
router.post('/conversations/:conversationId/prompts', createPromptHistory);

// GET /api/admin/conversations/:conversationId/prompts
router.get('/conversations/:conversationId/prompts', getPromptHistories);

// GET /api/admin/prompts/:id
router.get('/prompts/:id', getPromptHistoryById);

// PUT /api/admin/prompts/:id
router.put('/prompts/:id', updatePromptHistory);

// DELETE /api/admin/prompts/:id
router.delete('/prompts/:id', deletePromptHistory);

export default router;