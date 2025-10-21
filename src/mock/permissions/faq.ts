// FAQ Management permissions
export const faqPermissions = [
  {
    name: 'admin_faqs_get',
    description: 'GET admin FAQs endpoint',
    category: 'faq',
    route: '/api/admin/faqs',
    method: 'GET',
  },
  {
    name: 'admin_faqs_post',
    description: 'POST admin FAQs endpoint',
    category: 'faq',
    route: '/api/admin/faqs',
    method: 'POST',
  },
  {
    name: 'admin_faqs_put',
    description: 'PUT admin FAQs endpoint',
    category: 'faq',
    route: '/api/admin/faqs/:id',
    method: 'PUT',
  },
  {
    name: 'admin_faqs_delete',
    description: 'DELETE admin FAQs endpoint',
    category: 'faq',
    route: '/api/admin/faqs/:id',
    method: 'DELETE',
  },
];
