// Permissions for prompts, jobs, and FAQs
export const mockPermissions = [
  // Prompts Management permissions
  {
    name: 'admin_prompts_get',
    description: 'GET admin prompts endpoint',
    category: 'api',
    route: '/api/admin/prompts',
    method: 'GET',
  },
  {
    name: 'admin_prompts_post',
    description: 'POST admin prompts endpoint',
    category: 'api',
    route: '/api/admin/prompts',
    method: 'POST',
  },
  {
    name: 'admin_prompts_put',
    description: 'PUT admin prompts endpoint',
    category: 'api',
    route: '/api/admin/prompts/:id',
    method: 'PUT',
  },
  {
    name: 'admin_prompts_delete',
    description: 'DELETE admin prompts endpoint',
    category: 'api',
    route: '/api/admin/prompts/:id',
    method: 'DELETE',
  },

  // Jobs Management permissions
  {
    name: 'admin_jobs_get',
    description: 'GET admin jobs endpoint',
    category: 'api',
    route: '/api/admin/jobs',
    method: 'GET',
  },
  {
    name: 'admin_jobs_post',
    description: 'POST admin jobs endpoint',
    category: 'api',
    route: '/api/admin/jobs',
    method: 'POST',
  },
  {
    name: 'admin_jobs_put',
    description: 'PUT admin jobs endpoint',
    category: 'api',
    route: '/api/admin/jobs/:id',
    method: 'PUT',
  },
  {
    name: 'admin_jobs_delete',
    description: 'DELETE admin jobs endpoint',
    category: 'api',
    route: '/api/admin/jobs/:id',
    method: 'DELETE',
  },
  {
    name: 'admin_jobs_start',
    description: 'Start a job',
    category: 'api',
    route: '/api/admin/jobs/:id/start',
    method: 'POST',
  },
  {
    name: 'admin_jobs_cancel',
    description: 'Cancel a job',
    category: 'api',
    route: '/api/admin/jobs/:id/cancel',
    method: 'POST',
  },
  {
    name: 'admin_jobs_restart',
    description: 'Restart a job',
    category: 'api',
    route: '/api/admin/jobs/:id/restart',
    method: 'POST',
  },

  // FAQ Management permissions
  {
    name: 'admin_faqs_get',
    description: 'GET admin FAQs endpoint',
    category: 'api',
    route: '/api/admin/faqs',
    method: 'GET',
  },
  {
    name: 'admin_faqs_post',
    description: 'POST admin FAQs endpoint',
    category: 'api',
    route: '/api/admin/faqs',
    method: 'POST',
  },
  {
    name: 'admin_faqs_put',
    description: 'PUT admin FAQs endpoint',
    category: 'api',
    route: '/api/admin/faqs/:id',
    method: 'PUT',
  },
  {
    name: 'admin_faqs_delete',
    description: 'DELETE admin FAQs endpoint',
    category: 'api',
    route: '/api/admin/faqs/:id',
    method: 'DELETE',
  },
];
