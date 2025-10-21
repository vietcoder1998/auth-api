export const reportPermissions = [
  {
    name: 'view_reports',
    description: 'View system reports',
    category: 'report',
    route: '/api/admin/reports',
    method: 'GET',
  },
  {
    name: 'create_reports',
    description: 'Create new reports',
    category: 'report',
    route: '/api/admin/reports',
    method: 'POST',
  },
  {
    name: 'export_reports',
    description: 'Export reports',
    category: 'report',
    route: '/api/admin/reports/export',
    method: 'GET',
  },
];
