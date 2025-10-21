// Socket Management permissions
export const socketPermissions = [
  {
    name: 'admin_sockets_get',
    description: 'GET admin sockets endpoint',
    category: 'socket',
    route: '/api/admin/sockets',
    method: 'GET',
  },
  {
    name: 'admin_sockets_post',
    description: 'POST admin sockets endpoint',
    category: 'socket',
    route: '/api/admin/sockets',
    method: 'POST',
  },
  {
    name: 'admin_sockets_put',
    description: 'PUT admin sockets endpoint',
    category: 'socket',
    route: '/api/admin/sockets/:id',
    method: 'PUT',
  },
  {
    name: 'admin_sockets_delete',
    description: 'DELETE admin sockets endpoint',
    category: 'socket',
    route: '/api/admin/sockets/:id',
    method: 'DELETE',
  },
  {
    name: 'admin_socket_events_get',
    description: 'GET admin socket events endpoint',
    category: 'socket_event',
    route: '/api/admin/sockets/:socketConfigId/events',
    method: 'GET',
  },
  {
    name: 'admin_socket_events_post',
    description: 'POST admin socket events endpoint',
    category: 'socket_event',
    route: '/api/admin/sockets/:socketConfigId/events',
    method: 'POST',
  },
  {
    name: 'admin_socket_events_delete',
    description: 'DELETE admin socket event',
    category: 'socket_event',
    route: '/api/admin/sockets/events/:id',
    method: 'DELETE',
  },
];
