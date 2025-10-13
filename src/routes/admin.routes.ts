import { createPermission, getPermissions, updatePermission } from '../controllers/permission.controller';
import { createRole, getRoles, updateRole } from '../controllers/role.controller';
import { grantToken, revokeToken } from '../controllers/token.controller';
import { createUser, getUsers, searchUsers, updateUser } from '../controllers/user.controller';
import { Router } from 'express';


const router = Router();


// User endpoints
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.get('/users/search', searchUsers);

// Role endpoints
router.get('/roles', getRoles);
router.post('/roles', createRole);
router.put('/roles/:id', updateRole);

// Permission endpoints
router.get('/permissions', getPermissions);
router.post('/permissions', createPermission);
router.put('/permissions/:id', updatePermission);

// Token endpoints
router.post('/tokens/revoke', revokeToken);
router.post('/tokens/grant', grantToken);

export default router;
