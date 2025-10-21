// Prompts Management permissions
export const promptPermissions = [
  {
    name: 'admin_prompts_get',
    description: 'GET admin prompts endpoint',
    category: 'prompt',
    route: '/api/admin/prompts',
    method: 'GET',
  },
  {
    name: 'admin_prompts_post',
    description: 'POST admin prompts endpoint',
    category: 'prompt',
    route: '/api/admin/prompts',
    method: 'POST',
  },
  {
    name: 'admin_prompts_put',
    description: 'PUT admin prompts endpoint',
    category: 'prompt',
    route: '/api/admin/prompts/:id',
    method: 'PUT',
  },
  {
    name: 'admin_prompts_delete',
    description: 'DELETE admin prompts endpoint',
    category: 'prompt',
    route: '/api/admin/prompts/:id',
    method: 'DELETE',
  },
];
