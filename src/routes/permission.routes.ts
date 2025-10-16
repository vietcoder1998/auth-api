import { Router } from 'express';
import { 
  getPermissions, 
  createPermission, 
  updatePermission, 
  deletePermission,
  createPermissionWithSuperadmin,
  addPermissionToSuperadmin
} from '../controllers/permission.controller';

const router = Router();

router.get('/', getPermissions);
router.post('/', createPermission);
router.post('/with-superadmin', createPermissionWithSuperadmin);
router.post('/:permissionId/add-to-superadmin', addPermissionToSuperadmin);
router.put('/:id', updatePermission);
router.delete('/:id', deletePermission);

export default router;
