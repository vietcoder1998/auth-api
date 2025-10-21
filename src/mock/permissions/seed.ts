// Seed Management permissions
export const seedPermissions = [
  {
    name: 'admin_seed_stats',
    description: 'GET admin seed statistics endpoint',
    category: 'seed',
    route: '/api/admin/seed/stats',
    method: 'GET',
  },
  {
    name: 'admin_seed_data',
    description: 'GET admin seed data endpoint',
    category: 'seed',
    route: '/api/admin/seed/data',
    method: 'GET',
  },
  {
    name: 'admin_seed_all',
    description: 'POST admin seed all data endpoint',
    category: 'seed',
    route: '/api/admin/seed/all',
    method: 'POST',
  },
  {
    name: 'admin_seed_clear_all',
    description: 'DELETE admin clear all data endpoint',
    category: 'seed',
    route: '/api/admin/seed/clear-all',
    method: 'DELETE',
  },
];
