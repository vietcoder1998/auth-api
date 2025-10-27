export const permissionPermissions = [
  {
    name: 'create_permission',
    description: 'Create new permissions',
    category: 'permission',
    route: '/api/admin/permissions',
    method: 'POST',
  },
  {
    name: 'read_permission',
    description: 'View permission information',
    category: 'permission',
    route: '/api/admin/permissions',
    method: 'GET',
  },
  {
    name: 'get_permissions',
    description: 'Get all permissions',
    category: 'permission',
    route: '/api/admin/permissions',
    method: 'GET',
  },
  {
    name: 'update_permission',
    description: 'Update permission information',
    category: 'permission',
    route: '/api/admin/permissions/:id',
    method: 'PUT',
  },
  {
    name: 'update_permissions',
    description: 'Update multiple permissions',
    category: 'permission',
    route: '/api/admin/permissions',
    method: 'PUT',
  },
  {
    name: 'delete_permission',
    description: 'Delete permissions',
    category: 'permission',
    route: '/api/admin/permissions/:id',
    method: 'DELETE',
  },
  {
    name: 'manage_permissions',
    description: 'Full permission management access',
    category: 'permission',
  },
];
