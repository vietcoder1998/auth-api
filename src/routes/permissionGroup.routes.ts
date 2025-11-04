import { BaseRouter } from './base.route';
import { permissionGroupController } from '../controllers/permissionGroup.controller';

export class PermissionGroupRouter extends BaseRouter<any, any, any> {
  constructor() {
    super('permission-groups', permissionGroupController);
    this.initializeRoutes();
  }

  override initializeRoutes() {
    // Override base routes with permission group-specific methods
    this.routes.get('/', permissionGroupController.getPermissionGroups.bind(permissionGroupController));
    this.routes.post('/', permissionGroupController.createPermissionGroup.bind(permissionGroupController));
    this.routes.get('/:id', permissionGroupController.getPermissionGroupById.bind(permissionGroupController));
    this.routes.put('/:id', permissionGroupController.updatePermissionGroup.bind(permissionGroupController));
    this.routes.delete('/:id', permissionGroupController.deletePermissionGroup.bind(permissionGroupController));

    // Custom permission group routes for permission management
    this.routes.get('/:id/permissions/available', permissionGroupController.getPermissionsNotInGroup.bind(permissionGroupController));
    this.routes.post('/:id/permissions/add', permissionGroupController.addPermissionsToGroup.bind(permissionGroupController));
    this.routes.post('/:id/permissions/remove', permissionGroupController.removePermissionsFromGroup.bind(permissionGroupController));

    // Role assignment routes
    this.routes.post('/:id/assign-role', permissionGroupController.assignGroupToRole.bind(permissionGroupController));
    this.routes.post('/:id/unassign-role', permissionGroupController.unassignGroupFromRole.bind(permissionGroupController));
    
    // Get groups by role
    this.routes.get('/role/:roleId', permissionGroupController.getGroupsByRole.bind(permissionGroupController));
  }
}

// Export an instance
const permissionGroupRouter = new PermissionGroupRouter();
export default permissionGroupRouter.routes;