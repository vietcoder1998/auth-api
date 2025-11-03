import { Router } from 'express';
import { agentController } from '../controllers/agent.controller';

const router = Router();

// Agent CRUD operations
router.get('/', (req, res) => agentController.getUserAgents(req, res));
router.post('/', (req, res) => agentController.create(req, res));
router.get('/:id', (req, res) => agentController.findOne(req, res));
router.put('/:id', (req, res) => agentController.update(req, res));
router.delete('/:id', (req, res) => agentController.delete(req, res));

// Agent AI key operations
router.put('/:id/ai-keys', (req, res) => agentController.updateAgentKeys(req, res));
router.post('/:id/ai-keys/add', (req, res) => agentController.addKeysToAgent(req, res));
router.post('/:id/ai-keys/remove', (req, res) => agentController.removeKeysFromAgent(req, res));

// Agent memory operations
router.post('/:id/memories', (req, res) => agentController.addMemory(req, res));
router.get('/:id/memories', (req, res) => agentController.getMemories(req, res));

export default router;
