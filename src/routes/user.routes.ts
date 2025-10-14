import { Router } from 'express';
import { getUsers, createUser, updateUser, searchUsers, loginAsUser, deleteUser } from '../controllers/user.controller';
import { jwtTokenValidation } from '../middlewares/auth.middleware';

const router = Router();

// Apply JWT authentication middleware to all routes
router.use(jwtTokenValidation);

router.get('/', getUsers);
router.get('/search', searchUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:email', deleteUser);
router.post('/login-as', loginAsUser);

export default router;
