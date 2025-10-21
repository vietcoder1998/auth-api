export const aiKeyPermissions = [
  { name: 'aiKey_create', description: 'Create AI Key', category: 'aiKey', method: 'POST', route: '/admin/ai-keys' },
  { name: 'aiKey_read', description: 'Read AI Key', category: 'aiKey', method: 'GET', route: '/admin/ai-keys' },
  { name: 'aiKey_update', description: 'Update AI Key', category: 'aiKey', method: 'PUT', route: '/admin/ai-keys/:id' },
  { name: 'aiKey_delete', description: 'Delete AI Key', category: 'aiKey', method: 'DELETE', route: '/admin/ai-keys/:id' },
];