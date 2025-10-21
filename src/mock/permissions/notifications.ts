// Notification Management permissions
export const notificationPermissionsExtra = [
  {
    name: 'admin_notifications_get',
    description: 'GET admin notifications endpoint',
    category: 'notification',
    route: '/api/admin/notifications',
    method: 'GET',
  },
  {
    name: 'admin_notifications_post',
    description: 'POST admin notifications endpoint',
    category: 'notification',
    route: '/api/admin/notifications',
    method: 'POST',
  },
  {
    name: 'admin_notifications_put',
    description: 'PUT admin notifications endpoint',
    category: 'notification',
    route: '/api/admin/notifications/:id',
    method: 'PUT',
  },
  {
    name: 'admin_notifications_delete',
    description: 'DELETE admin notifications endpoint',
    category: 'notification',
    route: '/api/admin/notifications/:id',
    method: 'DELETE',
  },
];
