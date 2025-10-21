import { Router } from 'express';
import * as aiPlatformController from '../controllers/aiPlatform.controller';

const router = Router();

router.post('/', aiPlatformController.createAIPlatform);
router.get('/', aiPlatformController.getAIPlatforms);
router.get('/:id', aiPlatformController.getAIPlatformById);
router.put('/:id', aiPlatformController.updateAIPlatform);
router.delete('/:id', aiPlatformController.deleteAIPlatform);

export default router;
