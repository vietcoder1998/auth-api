import { Router } from 'express';
import {
  addMessage,
  createConversation,
  createPromptHistory,
  deleteConversation,
  deletePromptHistory,
  executeCommand,
  getConversation,
  getConversations,
  getMessages,
  updateConversation,
  updatePromptHistory,
} from '../controllers/conversation.controller';
import { getPromptHistories } from '../controllers/promptHistory.controller';

const router = Router();

// Conversation CRUD operations
router.get('/', getConversations);
router.post('/', createConversation);
router.get('/:id', getConversation);
router.put('/:id', updateConversation);
router.delete('/:id', deleteConversation);

// Message operations
router.get('/:id/messages', getMessages);
router.post('/:id/messages', addMessage);

// Command operations
router.post('/:id/command', executeCommand);

// Example: in your conversation.routes.ts or similar
router.post('/conversations/:conversationId/prompts', createPromptHistory);
router.get('/conversations/:conversationId/prompts', getPromptHistories);
router.put('/prompts/:id', updatePromptHistory);
router.delete('/prompts/:id', deletePromptHistory);

export default router;
