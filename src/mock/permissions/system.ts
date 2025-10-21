export const systemPermissions = [
  { name: 'system_admin', description: 'System administration access', category: 'system' },
  {
    name: 'system_config',
    description: 'System configuration access',
    category: 'system',
    route: '/api/config',
    method: 'GET',
  },
  {
    name: 'system_logs',
    description: 'View system logs',
    category: 'system',
    route: '/api/admin/logs',
    method: 'GET',
  },
  {
    name: 'manage_cache',
    description: 'Manage cache system',
    category: 'system',
    route: '/api/admin/cache',
    method: 'GET',
  },
];
