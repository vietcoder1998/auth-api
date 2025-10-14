import { Router } from 'express';
import { getPermissions, createPermission, updatePermission, deletePermission } from '../controllers/permission.controller';

const router = Router();

router.get('/', getPermissions);
router.post('/', createPermission);
router.put('/:id', updatePermission);
router.delete('/:id', deletePermission);

export default router;
