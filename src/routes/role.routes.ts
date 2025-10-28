import { BaseRouter } from './base.route';
import { roleController } from '../controllers/role.controller';

export class RoleRouter extends BaseRouter<any, any, any> {
  constructor() {
    super('roles', roleController);
    this.initializeRoutes();
  }

  override initializeRoutes() {
    // Override base routes with role-specific methods
    this.routes.get('/', roleController.getRoles.bind(roleController));
    this.routes.post('/', roleController.createRole.bind(roleController));
    this.routes.put('/:id', roleController.updateRole.bind(roleController));
    this.routes.delete('/:id', roleController.deleteRole.bind(roleController));

    // Custom role routes for permission management
    this.routes.get('/:id/permissions/available', roleController.getPermissionsNotInRole.bind(roleController));
    this.routes.post('/:id/permissions/add', roleController.addPermissionsToRole.bind(roleController));
  }
}

// Export an instance
const roleRouter = new RoleRouter();
export default roleRouter.routes;
