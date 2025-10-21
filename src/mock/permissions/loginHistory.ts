// Login History Management permissions
export const loginHistoryPermissions = [
  {
    name: 'admin_login_history_get',
    description: 'GET admin login history endpoint',
    category: 'loginHistory',
    route: '/api/admin/login-history',
    method: 'GET',
  },
  {
    name: 'admin_login_history_post',
    description: 'POST admin login history endpoint',
    category: 'loginHistory',
    route: '/api/admin/login-history',
    method: 'POST',
  },
  {
    name: 'admin_login_history_put',
    description: 'PUT admin login history endpoint',
    category: 'loginHistory',
    route: '/api/admin/login-history/:id',
    method: 'PUT',
  },
  {
    name: 'admin_login_history_patch',
    description: 'PATCH admin login history endpoint',
    category: 'loginHistory',
    route: '/api/admin/login-history/:id',
    method: 'PATCH',
  },
  {
    name: 'admin_login_history_delete',
    description: 'DELETE admin login history endpoint',
    category: 'loginHistory',
    route: '/api/admin/login-history/:id',
    method: 'DELETE',
  },
  {
    name: 'admin_login_history_logout',
    description: 'PATCH admin login history logout endpoint',
    category: 'loginHistory',
    route: '/api/admin/login-history/:id/logout',
    method: 'PATCH',
  },
  {
    name: 'admin_login_history_stats',
    description: 'GET admin login history statistics endpoint',
    category: 'loginHistory',
    route: '/api/admin/login-history/stats',
    method: 'GET',
  },
  {
    name: 'admin_login_history_get_by_id',
    description: 'GET admin login history by ID endpoint',
    category: 'loginHistory',
    route: '/api/admin/login-history/:id',
    method: 'GET',
  },
];
