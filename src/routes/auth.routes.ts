import { Request, Response } from 'express';
import { authController } from '../controllers/auth.controller';
import { BaseRouter } from './base.route';

class AuthRoutes extends BaseRouter<any, any, any> {
  constructor() {
    super('/auth', authController);
    this.initializeRoutes();
  }

  protected initializeRoutes() {
    // Health check endpoint
    this.routes.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'ok', message: 'Auth API is healthy' });
    });

    this.routes.post('/login', authController.login.bind(authController));
    this.routes.post('/register', authController.register.bind(authController));
    this.routes.post('/validate', authController.validate.bind(authController));
    this.routes.get('/me', authController.getMe.bind(authController));
    this.routes.post('/handover-user-status', authController.handoverUserStatus.bind(authController));
  }
}

const authRoutes = new AuthRoutes();
export default authRoutes.routes;
