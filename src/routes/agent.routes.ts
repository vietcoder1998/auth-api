import { Router } from 'express';
import {
  getAgents,
  createAgent,
  getAgent,
  updateAgent,
  deleteAgent,
  addAgentMemory,
  getAgentMemories
} from '../controllers/agent.controller';

const router = Router();

// Agent CRUD operations
router.get('/', getAgents);
router.post('/', createAgent);
router.get('/:id', getAgent);
router.put('/:id', updateAgent);
router.delete('/:id', deleteAgent);

// Agent memory operations
router.post('/:id/memories', addAgentMemory);
router.get('/:id/memories', getAgentMemories);

export default router;