import { BaseRouter } from './base.route';
import { permissionController } from '../controllers/permission.controller';

class PermissionRouter extends BaseRouter<any, any, any> {
  constructor() {
    super('permissions', permissionController);
    this.initializeCustomRoutes();
  }

  private initializeCustomRoutes() {
    // Override base routes with permission-specific methods
    this.routes.get('/', permissionController.getPermissions.bind(permissionController));
    this.routes.post('/', permissionController.createPermission.bind(permissionController));
    this.routes.put('/:id', permissionController.updatePermission.bind(permissionController));
    this.routes.delete('/:id', permissionController.deletePermission.bind(permissionController));

    // Custom permission routes
    this.routes.post('/with-superadmin', permissionController.createPermissionWithSuperadmin.bind(permissionController));
    this.routes.post('/:permissionId/add-to-superadmin', permissionController.addPermissionToSuperadmin.bind(permissionController));
    this.routes.put('/batch', permissionController.batchUpdatePermissions.bind(permissionController));
  }
}

// Export an instance
const permissionRouter = new PermissionRouter();
export default permissionRouter.routes;
