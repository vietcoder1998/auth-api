// Config Management permissions
export const configPermissions = [
  {
    name: 'admin_config_get',
    description: 'GET admin config endpoint',
    category: 'config',
    route: '/api/admin/config',
    method: 'GET',
  },
  {
    name: 'admin_config_post',
    description: 'POST admin config endpoint',
    category: 'config',
    route: '/api/admin/config',
    method: 'POST',
  },
  {
    name: 'admin_config_put',
    description: 'PUT admin config endpoint',
    category: 'config',
    route: '/api/admin/config/:key',
    method: 'PUT',
  },
  {
    name: 'admin_config_delete',
    description: 'DELETE admin config endpoint',
    category: 'config',
    route: '/api/admin/config/:key',
    method: 'DELETE',
  },
];
