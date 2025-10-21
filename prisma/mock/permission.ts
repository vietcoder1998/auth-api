// Default notification permissions for all users
export const mockNotificationPermissions = [
  {
    name: 'notification_read',
    description: 'Read notifications',
    category: 'notification',
    route: '/admin/notifications',
    method: 'GET',
  },
  {
    name: 'notification_update',
    description: 'Update notifications',
    category: 'notification',
    route: '/admin/notifications/:id',
    method: 'PUT',
  },
];
