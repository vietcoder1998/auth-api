export const billingPermissions = [
  {
    name: 'billing_create',
    description: 'Create Billing',
    category: 'billing',
    method: 'POST',
    route: '/admin/billings',
  },
  {
    name: 'billing_read',
    description: 'Read Billing',
    category: 'billing',
    method: 'GET',
    route: '/admin/billings',
  },
  {
    name: 'billing_update',
    description: 'Update Billing',
    category: 'billing',
    method: 'PUT',
    route: '/admin/billings/:id',
  },
  {
    name: 'billing_delete',
    description: 'Delete Billing',
    category: 'billing',
    method: 'DELETE',
    route: '/admin/billings/:id',
  },
];
