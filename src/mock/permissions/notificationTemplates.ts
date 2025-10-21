// Notification Template Management permissions
export const notificationTemplatePermissions = [
  {
    name: 'admin_notification_templates_get',
    description: 'GET admin notification templates endpoint',
    category: 'notificationTemplate',
    route: '/api/admin/notification-templates',
    method: 'GET',
  },
  {
    name: 'admin_notification_templates_post',
    description: 'POST admin notification templates endpoint',
    category: 'notificationTemplate',
    route: '/api/admin/notification-templates',
    method: 'POST',
  },
  {
    name: 'admin_notification_templates_put',
    description: 'PUT admin notification templates endpoint',
    category: 'notificationTemplate',
    route: '/api/admin/notification-templates/:id',
    method: 'PUT',
  },
  {
    name: 'admin_notification_templates_patch',
    description: 'PATCH admin notification templates endpoint',
    category: 'notificationTemplate',
    route: '/api/admin/notification-templates/:id',
    method: 'PATCH',
  },
  {
    name: 'admin_notification_templates_delete',
    description: 'DELETE admin notification templates endpoint',
    category: 'notificationTemplate',
    route: '/api/admin/notification-templates/:id',
    method: 'DELETE',
  },
  {
    name: 'admin_notification_templates_get_by_id',
    description: 'GET admin notification template by ID endpoint',
    category: 'notificationTemplate',
    route: '/api/admin/notification-templates/:id',
    method: 'GET',
  },
];
