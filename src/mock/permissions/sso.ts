// SSO Management permissions
export const ssoPermissions = [
  {
    name: 'admin_sso_get',
    description: 'GET admin SSO entries endpoint',
    category: 'sso',
    route: '/api/admin/sso',
    method: 'GET',
  },
  {
    name: 'admin_sso_post',
    description: 'POST admin SSO entry endpoint',
    category: 'sso',
    route: '/api/admin/sso',
    method: 'POST',
  },
  {
    name: 'admin_sso_put',
    description: 'PUT admin SSO entry endpoint',
    category: 'sso',
    route: '/api/admin/sso/:id',
    method: 'PUT',
  },
  {
    name: 'admin_sso_delete',
    description: 'DELETE admin SSO entry endpoint',
    category: 'sso',
    route: '/api/admin/sso/:id',
    method: 'DELETE',
  },
  {
    name: 'admin_sso_stats',
    description: 'GET admin SSO statistics endpoint',
    category: 'sso',
    route: '/api/admin/sso/stats',
    method: 'GET',
  },
];
