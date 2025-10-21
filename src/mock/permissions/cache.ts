// Cache Management permissions
export const cachePermissions = [
  {
    name: 'admin_cache_get',
    description: 'GET admin cache endpoint',
    category: 'cache',
    route: '/api/admin/cache',
    method: 'GET',
  },
  {
    name: 'admin_cache_post',
    description: 'POST admin cache endpoint',
    category: 'cache',
    route: '/api/admin/cache',
    method: 'POST',
  },
  {
    name: 'admin_cache_delete',
    description: 'DELETE admin cache endpoint',
    category: 'cache',
    route: '/api/admin/cache',
    method: 'DELETE',
  },
  {
    name: 'admin_cache_stats',
    description: 'GET admin cache statistics endpoint',
    category: 'cache',
    route: '/api/admin/cache/stats',
    method: 'GET',
  },
];
