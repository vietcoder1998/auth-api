import { Router } from 'express';
import {
  getConversations,
  createConversation,
  getConversation,
  addMessage,
  updateConversation,
  deleteConversation
} from '../controllers/conversation.controller';

const router = Router();

// Conversation CRUD operations
router.get('/', getConversations);
router.post('/', createConversation);
router.get('/:id', getConversation);
router.put('/:id', updateConversation);
router.delete('/:id', deleteConversation);

// Message operations
router.post('/:id/messages', addMessage);

export default router;