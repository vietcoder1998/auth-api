// Mail Template Management permissions
export const mailTemplatePermissions = [
  {
    name: 'admin_mail_templates_get',
    description: 'GET admin mail templates endpoint',
    category: 'mailTemplate',
    route: '/api/admin/mail-templates',
    method: 'GET',
  },
  {
    name: 'admin_mail_templates_post',
    description: 'POST admin mail templates endpoint',
    category: 'mailTemplate',
    route: '/api/admin/mail-templates',
    method: 'POST',
  },
  {
    name: 'admin_mail_templates_put',
    description: 'PUT admin mail templates endpoint',
    category: 'mailTemplate',
    route: '/api/admin/mail-templates/:id',
    method: 'PUT',
  },
  {
    name: 'admin_mail_templates_delete',
    description: 'DELETE admin mail templates endpoint',
    category: 'mailTemplate',
    route: '/api/admin/mail-templates/:id',
    method: 'DELETE',
  },
  {
    name: 'admin_mail_templates_get_by_id',
    description: 'GET admin mail template by ID endpoint',
    category: 'mailTemplate',
    route: '/api/admin/mail-templates/:id',
    method: 'GET',
  },
];
