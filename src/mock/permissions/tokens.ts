// Token Management permissions
export const tokenPermissions = [
  {
    name: 'admin_tokens_get',
    description: 'GET admin tokens endpoint',
    category: 'token',
    route: '/api/admin/tokens',
    method: 'GET',
  },
  {
    name: 'admin_tokens_post',
    description: 'POST admin tokens endpoint',
    category: 'token',
    route: '/api/admin/tokens',
    method: 'POST',
  },
  {
    name: 'admin_tokens_put',
    description: 'PUT admin tokens endpoint',
    category: 'token',
    route: '/api/admin/tokens/:id',
    method: 'PUT',
  },
  {
    name: 'admin_tokens_patch',
    description: 'PATCH admin tokens endpoint',
    category: 'token',
    route: '/api/admin/tokens/:id',
    method: 'PATCH',
  },
  {
    name: 'admin_tokens_delete',
    description: 'DELETE admin tokens endpoint',
    category: 'token',
    route: '/api/admin/tokens/:id',
    method: 'DELETE',
  },
  {
    name: 'admin_tokens_revoke',
    description: 'POST admin tokens revoke endpoint',
    category: 'token',
    route: '/api/admin/tokens/revoke',
    method: 'POST',
  },
  {
    name: 'admin_tokens_grant',
    description: 'POST admin tokens grant endpoint',
    category: 'token',
    route: '/api/admin/tokens/grant',
    method: 'POST',
  },
];
