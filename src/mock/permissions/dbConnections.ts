// Database Connection Management permissions
export const dbConnectionPermissions = [
  {
    name: 'admin_database_connections_get',
    description: 'GET admin database connections endpoint',
    category: 'database',
    route: '/api/admin/database-connections',
    method: 'GET',
  },
  {
    name: 'admin_database_connections_post',
    description: 'POST admin database connections endpoint',
    category: 'database',
    route: '/api/admin/database-connections',
    method: 'POST',
  },
  {
    name: 'admin_database_connections_put',
    description: 'PUT admin database connections endpoint',
    category: 'database',
    route: '/api/admin/database-connections/:id',
    method: 'PUT',
  },
  {
    name: 'admin_database_connections_delete',
    description: 'DELETE admin database connections endpoint',
    category: 'database',
    route: '/api/admin/database-connections/:id',
    method: 'DELETE',
  },
  {
    name: 'admin_database_connections_test',
    description: 'POST admin database connections test endpoint',
    category: 'database',
    route: '/api/admin/database-connections/:id/test',
    method: 'POST',
  },
  {
    name: 'admin_database_connections_check',
    description: 'POST admin database connections check endpoint',
    category: 'database',
    route: '/api/admin/database-connections/:id/check',
    method: 'POST',
  },
  {
    name: 'admin_database_connections_backup',
    description: 'POST admin database connections backup endpoint',
    category: 'database',
    route: '/api/admin/database-connections/:id/backup',
    method: 'POST',
  },
  {
    name: 'admin_database_connections_stats',
    description: 'GET admin database connections statistics endpoint',
    category: 'database',
    route: '/api/admin/database-connections/stats',
    method: 'GET',
  },
];
