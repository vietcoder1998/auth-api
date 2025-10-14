import { Router } from 'express';
import { getRoles, createRole, updateRole } from '../controllers/role.controller';

const router = Router();

router.get('/', getRoles);
router.post('/', createRole);
router.put('/:id', updateRole);

export default router;
