import { Router } from 'express';
import {
  addMessage,
  createConversation,
  deleteConversation,
  executeCommand,
  getConversation,
  getConversations,
  getMessages,
  updateConversation,
} from '../controllers/conversation.controller';
import {
  createPromptHistory,
  deletePromptHistory,
  getPromptHistories,
  updatePromptHistory,
} from '../controllers/promptHistory.controller';

const router = Router();
// Prompt CRUD for a conversation
router.post('/:id/prompts', createPromptHistory);
router.get('/:id/prompts', getPromptHistories);
router.put('/prompts/:id', updatePromptHistory);
router.delete('/prompts/:id', deletePromptHistory);

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

export default router;
