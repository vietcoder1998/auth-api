import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  searchUsers,
  loginAsUser,
  deleteUser,
} from '../controllers/user.controller';

const router = Router();

router.get('/', getUsers);
router.get('/search', searchUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:email', deleteUser);
router.post('/login-as', loginAsUser);

export default router;
