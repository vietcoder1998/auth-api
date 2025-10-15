import { Router } from 'express';
import { getRoles, createRole, updateRole, deleteRole } from '../controllers/role.controller';

const router = Router();

router.get('/', getRoles);
router.post('/', createRole);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);

export default router;
