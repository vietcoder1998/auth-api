import { BaseRouter } from './base.route';
import { userController } from '../controllers';
import { UserModel, UserDto, UserDro } from '../interfaces';

// Extend BaseRouter for user routes
class UserRouter extends BaseRouter<UserModel, UserDto, UserDro> {
  constructor() {
    super('users', userController);
  }
}

const userRouter = new UserRouter();
export default userRouter.routes;
