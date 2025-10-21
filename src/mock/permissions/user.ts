export const userPermissions = [
  {
    name: 'create_user',
    description: 'Create new users',
    category: 'user',
    route: '/api/admin/users',
    method: 'POST',
  },
  {
    name: 'read_user',
    description: 'View user information',
    category: 'user',
    route: '/api/admin/users',
    method: 'GET',
  },
  {
    name: 'update_user',
    description: 'Update user information',
    category: 'user',
    route: '/api/admin/users/:id',
    method: 'PUT',
  },
  {
    name: 'delete_user',
    description: 'Delete users',
    category: 'user',
    route: '/api/admin/users/:id',
    method: 'DELETE',
  },
  { name: 'manage_users', description: 'Full user management access', category: 'user' },
  {
    name: 'view_self',
    description: 'View own profile',
    category: 'user',
    route: '/api/profile',
    method: 'GET',
  },
];
