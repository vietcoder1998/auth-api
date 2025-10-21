// Example Job Management permissions for API documentation/testing
export const jobExamplePermissions = [
  {
    name: 'admin_jobs_get',
    description: 'GET admin jobs endpoint (example)',
    category: 'job',
    route: '/api/admin/jobs',
    method: 'GET',
  },
  {
    name: 'admin_jobs_post',
    description: 'POST admin jobs endpoint (example)',
    category: 'job',
    route: '/api/admin/jobs',
    method: 'POST',
  },
  {
    name: 'admin_jobs_put',
    description: 'PUT admin jobs endpoint (example)',
    category: 'job',
    route: '/api/admin/jobs/:id',
    method: 'PUT',
  },
  {
    name: 'admin_jobs_delete',
    description: 'DELETE admin jobs endpoint (example)',
    category: 'job',
    route: '/api/admin/jobs/:id',
    method: 'DELETE',
  },
];
