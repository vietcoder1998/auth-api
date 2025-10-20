import { Router } from 'express';
import {
  createPromptHistory,
  getPromptHistories,
  getPromptHistoryById,
  updatePromptHistory,
  deletePromptHistory,
  getAllPromptHistories
} from '../controllers/promptHistory.controller';
// GET /api/admin/prompts (all prompts, not bound to conversation)

const router = Router();

// GET /prompts (all prompts, not bound to conversation, not under /api/admin)
router.get('/', getAllPromptHistories);

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
router.get('/prompts', getAllPromptHistories);

export default router;