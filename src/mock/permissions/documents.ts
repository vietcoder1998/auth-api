// Document Management permissions
export const documentPermissions = [
  {
    name: 'admin_documents_get',
    description: 'GET admin documents endpoint',
    category: 'document',
    route: '/api/admin/documents',
    method: 'GET',
  },
  {
    name: 'admin_documents_post',
    description: 'POST admin documents endpoint',
    category: 'document',
    route: '/api/admin/documents',
    method: 'POST',
  },
  {
    name: 'admin_documents_put',
    description: 'PUT admin documents endpoint',
    category: 'document',
    route: '/api/admin/documents/:id',
    method: 'PUT',
  },
  {
    name: 'admin_documents_delete',
    description: 'DELETE admin documents endpoint',
    category: 'document',
    route: '/api/admin/documents/:id',
    method: 'DELETE',
  },
];
