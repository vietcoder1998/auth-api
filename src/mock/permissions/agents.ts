// AI Agent Management permissions
export const agentPermissions = [
  {
    name: 'admin_agents_get',
    description: 'GET admin agents endpoint',
    category: 'agent',
    route: '/api/admin/agents',
    method: 'GET',
  },
  {
    name: 'admin_agents_post',
    description: 'POST admin agents endpoint',
    category: 'agent',
    route: '/api/admin/agents',
    method: 'POST',
  },
  {
    name: 'admin_agents_put',
    description: 'PUT admin agents endpoint',
    category: 'agent',
    route: '/api/admin/agents/:id',
    method: 'PUT',
  },
  {
    name: 'admin_agents_delete',
    description: 'DELETE admin agents endpoint',
    category: 'agent',
    route: '/api/admin/agents/:id',
    method: 'DELETE',
  },
  {
    name: 'admin_agents_memories_get',
    description: 'GET admin agent memories endpoint',
    category: 'agentMemory',
    route: '/api/admin/agents/:id/memories',
    method: 'GET',
  },
  {
    name: 'admin_agents_memories_post',
    description: 'POST admin agent memories endpoint',
    category: 'agentMemory',
    route: '/api/admin/agents/:id/memories',
    method: 'POST',
  },
];
