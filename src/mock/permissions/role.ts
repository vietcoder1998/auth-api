export const rolePermissions = [
  {
    name: 'create_role',
    description: 'Create new roles',
    category: 'role',
    route: '/api/admin/roles',
    method: 'POST',
  },
  {
    name: 'read_role',
    description: 'View role information',
    category: 'role',
    route: '/api/admin/roles',
    method: 'GET',
  },
  {
    name: 'update_role',
    description: 'Update role information',
    category: 'role',
    route: '/api/admin/roles/:id',
    method: 'PUT',
  },
  {
    name: 'delete_role',
    description: 'Delete roles',
    category: 'role',
    route: '/api/admin/roles/:id',
    method: 'DELETE',
  },
  { name: 'manage_roles', description: 'Full role management access', category: 'role' },
];
