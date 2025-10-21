// File Management permissions
export const filePermissions = [
  {
    name: 'admin_files_get',
    description: 'GET admin files endpoint',
    category: 'file',
    route: '/api/admin/files',
    method: 'GET',
  },
  {
    name: 'admin_files_post',
    description: 'POST admin files endpoint',
    category: 'file',
    route: '/api/admin/files',
    method: 'POST',
  },
  {
    name: 'admin_files_put',
    description: 'PUT admin files endpoint',
    category: 'file',
    route: '/api/admin/files/:id',
    method: 'PUT',
  },
  {
    name: 'admin_files_delete',
    description: 'DELETE admin files endpoint',
    category: 'file',
    route: '/api/admin/files/:id',
    method: 'DELETE',
  },
];
