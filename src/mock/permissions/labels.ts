// Label Management permissions
export const labelPermissions = [
  {
    name: 'admin_labels_get',
    description: 'GET admin labels endpoint',
    category: 'label',
    route: '/api/admin/labels',
    method: 'GET',
  },
  {
    name: 'admin_labels_post',
    description: 'POST admin labels endpoint',
    category: 'label',
    route: '/api/admin/labels',
    method: 'POST',
  },
  {
    name: 'admin_labels_put',
    description: 'PUT admin labels endpoint',
    category: 'label',
    route: '/api/admin/labels/:id',
    method: 'PUT',
  },
  {
    name: 'admin_labels_delete',
    description: 'DELETE admin labels endpoint',
    category: 'label',
    route: '/api/admin/labels/:id',
    method: 'DELETE',
  },
];
