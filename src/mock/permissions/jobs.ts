// Job Management permissions
export const jobPermissions = [
  {
    name: 'admin_jobs_get',
    description: 'GET admin jobs endpoint',
    category: 'job',
    route: '/api/admin/jobs',
    method: 'GET',
  },
  {
    name: 'admin_jobs_post',
    description: 'POST admin jobs endpoint',
    category: 'job',
    route: '/api/admin/jobs',
    method: 'POST',
  },
  {
    name: 'admin_jobs_put',
    description: 'PUT admin jobs endpoint',
    category: 'job',
    route: '/api/admin/jobs/:id',
    method: 'PUT',
  },
  {
    name: 'admin_jobs_delete',
    description: 'DELETE admin jobs endpoint',
    category: 'job',
    route: '/api/admin/jobs/:id',
    method: 'DELETE',
  },
  {
    name: 'admin_jobs_start',
    description: 'Start a job',
    category: 'job',
    route: '/api/admin/jobs/:id/start',
    method: 'POST',
  },
  {
    name: 'admin_jobs_cancel',
    description: 'Cancel a job',
    category: 'job',
    route: '/api/admin/jobs/:id/cancel',
    method: 'POST',
  },
  {
    name: 'admin_jobs_restart',
    description: 'Restart a job',
    category: 'job',
    route: '/api/admin/jobs/:id/restart',
    method: 'POST',
  },
];
