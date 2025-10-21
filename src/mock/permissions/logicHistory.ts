// Logic History Management permissions
export const logicHistoryPermissions = [
  {
    name: 'admin_logic_history_get',
    description: 'GET admin logic history endpoint',
    category: 'logicHistory',
    route: '/api/admin/logic-history',
    method: 'GET',
  },
  {
    name: 'admin_logic_history_post',
    description: 'POST admin logic history endpoint',
    category: 'logicHistory',
    route: '/api/admin/logic-history',
    method: 'POST',
  },
  {
    name: 'admin_logic_history_put',
    description: 'PUT admin logic history endpoint',
    category: 'logicHistory',
    route: '/api/admin/logic-history/:id',
    method: 'PUT',
  },
  {
    name: 'admin_logic_history_patch',
    description: 'PATCH admin logic history endpoint',
    category: 'logicHistory',
    route: '/api/admin/logic-history/:id',
    method: 'PATCH',
  },
  {
    name: 'admin_logic_history_delete',
    description: 'DELETE admin logic history endpoint',
    category: 'logicHistory',
    route: '/api/admin/logic-history/:id',
    method: 'DELETE',
  },
  {
    name: 'admin_logic_history_notification',
    description: 'PATCH admin logic history notification endpoint',
    category: 'logicHistory',
    route: '/api/admin/logic-history/:id/notification-sent',
    method: 'PATCH',
  },
  {
    name: 'admin_logic_history_stats',
    description: 'GET admin logic history statistics endpoint',
    category: 'logicHistory',
    route: '/api/admin/logic-history/stats',
    method: 'GET',
  },
  {
    name: 'admin_logic_history_get_by_id',
    description: 'GET admin logic history by ID endpoint',
    category: 'logicHistory',
    route: '/api/admin/logic-history/:id',
    method: 'GET',
  },
];
