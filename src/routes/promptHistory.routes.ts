import { Router } from 'express';
import {
  createPromptHistory,
  getPromptHistories,
  getPromptHistoryById,
  updatePromptHistory,
  deletePromptHistory,
  getAllPromptHistories,
} from '../controllers/promptHistory.controller';
import { generatePrompt } from '../controllers/promptHistory.controller';

const router = Router();

// GET /prompts (all prompts, not bound to conversation, not under /api/admin)
router.get('/', getAllPromptHistories);
router.post('/conversations/:conversationId/prompts', createPromptHistory);
router.get('/conversations/:conversationId/prompts', getPromptHistories);
router.post('/generate', generatePrompt);
router.get('/prompts/:id', getPromptHistoryById);
router.put('/prompts/:id', updatePromptHistory);
router.delete('/prompts/:id', deletePromptHistory);
router.get('/prompts', getAllPromptHistories);

export default router;
