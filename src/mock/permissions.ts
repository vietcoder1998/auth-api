// Split permissions into separate files for maintainability
import { userPermissions } from './permissions/user';
import { rolePermissions } from './permissions/role';
import { permissionPermissions } from './permissions/permission';
import { systemPermissions } from './permissions/system';
import { reportPermissions } from './permissions/report';
import { apiPermissions } from './permissions/api';
import { notificationPermissions } from './permissions/notification';
import { mockRoles } from './permissions/roles';
import { otherPermissions } from './permissions/other';

export const mockPermissions = [
  ...userPermissions,
  ...rolePermissions,
  ...permissionPermissions,
  ...systemPermissions,
  ...reportPermissions,
  ...apiPermissions,
  ...notificationPermissions,
  ...otherPermissions,
];

// Modular mock roles
export { mockRoles }
