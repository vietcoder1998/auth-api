import { Router } from 'express';
import {
  createPromptHistory,
  getPromptHistories,
  getPromptHistoryById,
  updatePromptHistory,
  deletePromptHistory,
  getAllPromptHistories,
} from '../controllers/promptHistory.controller';

const router = Router();

// GET /prompts (all prompts, not bound to conversation, not under /api/admin)
router.get('/', getAllPromptHistories);

// POST /api/admin/conversations/:conversationId/prompts
router.post('/conversations/:conversationId/prompts', createPromptHistory);

// GET /api/admin/conversations/:conversationId/prompts
router.get('/conversations/:conversationId/prompts', getPromptHistories);

// POST /api/admin/prompts/generate (AI generate endpoint)
router.post('/prompts/generate', async (req, res) => {
  // TODO: Implement AI generation logic or proxy to AI service
  // For now, return a placeholder response
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
  // Replace this with actual AI generation logic
  res.json({ data: `AI generated content for: ${prompt}` });
});

// GET /api/admin/prompts/:id
router.get('/prompts/:id', getPromptHistoryById);

// PUT /api/admin/prompts/:id
router.put('/prompts/:id', updatePromptHistory);

// DELETE /api/admin/prompts/:id
router.delete('/prompts/:id', deletePromptHistory);
router.get('/prompts', getAllPromptHistories);

export default router;
