// Modular mock roles for seeding
import { mockPermissions } from '../permissions';

export const mockRoles = [
  {
    name: 'superadmin',
    description: 'Super Administrator with full system access',
    permissionFilter: () => true, // All permissions
  },
  {
    name: 'admin',
    description: 'Administrator with limited management access',
    permissionFilter: (p: any) =>
      [
        'manage_users',
        'view_reports',
        'admin_login_history_get',
        'admin_logic_history_get',
        'admin_cache_get',
        'admin_cache_post',
        'admin_cache_delete',
        'view_logs',
        'manage_logs',
        'view_database_connections',
        'manage_database_connections',
      ].includes(p.name),
  },
  {
    name: 'user',
    description: 'Regular user with basic access',
    permissionFilter: (p: any) => p.name === 'view_self',
  },
];
