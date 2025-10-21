export const aiPlatformPermissions = [
  {
    name: 'aiPlatform_create',
    description: 'Create AI Platform',
    category: 'aiPlatform',
    method: 'POST',
    route: '/admin/ai-platforms',
  },
  {
    name: 'aiPlatform_read',
    description: 'Read AI Platform',
    category: 'aiPlatform',
    method: 'GET',
    route: '/admin/ai-platforms',
  },
  {
    name: 'aiPlatform_update',
    description: 'Update AI Platform',
    category: 'aiPlatform',
    method: 'PUT',
    route: '/admin/ai-platforms/:id',
  },
  {
    name: 'aiPlatform_delete',
    description: 'Delete AI Platform',
    category: 'aiPlatform',
    method: 'DELETE',
    route: '/admin/ai-platforms/:id',
  },
];
