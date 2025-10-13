import { Router } from 'express';
import { login, register, validate } from '../controllers/auth.controller';
const router = Router();
router.post('/login', login);
router.post('/register', register);
router.post('/validate', validate);
export default router;
