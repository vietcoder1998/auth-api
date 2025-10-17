import { Router } from 'express';
import { 
  getRoles, 
  createRole, 
  updateRole, 
  deleteRole, 
  getPermissionsNotInRole, 
  addPermissionsToRole 
} from '../controllers/role.controller';

const router = Router();

router.get('/', getRoles);
router.post('/', createRole);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);

// New endpoints for managing permissions not in role
router.get('/:id/permissions/available', getPermissionsNotInRole);
router.post('/:id/permissions/add', addPermissionsToRole);

export default router;
