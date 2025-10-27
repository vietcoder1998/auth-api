
import { Router } from 'express';
import { CommandController } from '../controllers/command.controller';


const router = Router();
const commandController = new CommandController();



// CRUD routes for Command
router.get('/:id', commandController.findOne.bind(commandController));
router.post('/', commandController.create.bind(commandController));
router.put('/:id', commandController.update.bind(commandController));
router.delete('/:id', commandController.delete.bind(commandController));

// POST /api/commands/process - process a command (custom logic)
router.post('/process', commandController.processCommand.bind(commandController));

export default router;
