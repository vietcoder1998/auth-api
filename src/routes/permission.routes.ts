import { permissionController } from '../controllers/permission.controller';
import { BaseRouter } from './base.route';

class PermissionRouter extends BaseRouter<any, any, any> {
  constructor() {
    super('permissions', permissionController);
    this.initializeRoutes();
  }

  public override initializeRoutes() {
    // Override base routes with permission-specific methods
    this.routes.get('/', permissionController.getPermissions.bind(permissionController));
    this.routes.post(
      '/',
      permissionController.createPermissionWithSuperadmin.bind(permissionController),
    );
    this.routes.put('/:id', permissionController.updatePermission.bind(permissionController));
    this.routes.delete('/:id', permissionController.deletePermission.bind(permissionController));

    // Custom permission routes
    this.routes.post(
      '/with-superadmin',
      permissionController.createPermissionWithSuperadmin.bind(permissionController),
    );
    this.routes.post(
      '/:permissionId/add-to-superadmin',
      permissionController.addPermissionToSuperadmin.bind(permissionController),
    );
    this.routes.put(
      '/batch',
      permissionController.batchUpdatePermissions.bind(permissionController),
    );
  }
}

// Export an instance
const permissionRouter = new PermissionRouter();
export default permissionRouter.routes;
