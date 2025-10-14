import { Router } from 'express';
import { getPermissions, createPermission, updatePermission } from '../controllers/permission.controller';

const router = Router();

router.get('/', getPermissions);
router.post('/', createPermission);
router.put('/:id', updatePermission);

export default router;
