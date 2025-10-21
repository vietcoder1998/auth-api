// Blog and Category permissions for modular seeding

export const blogPermissions = [
  {
    name: 'blog_get',
    description: 'View list of blogs',
    category: 'blog',
    route: '/api/public/blogs',
    method: 'GET',
  },
  {
    name: 'blog_get_single',
    description: 'View single blog',
    category: 'blog',
    route: '/api/public/blogs/:id',
    method: 'GET',
  },
  {
    name: 'blog_post',
    description: 'Create blog',
    category: 'blog',
    route: '/api/public/blogs',
    method: 'POST',
  },
  {
    name: 'blog_put',
    description: 'Update blog',
    category: 'blog',
    route: '/api/public/blogs/:id',
    method: 'PUT',
  },
  {
    name: 'blog_delete',
    description: 'Delete blog',
    category: 'blog',
    route: '/api/public/blogs/:id',
    method: 'DELETE',
  },
];

export const categoryPermissions = [
  {
    name: 'category_get',
    description: 'View list of categories',
    category: 'category',
    route: '/api/public/categories',
    method: 'GET',
  },
  {
    name: 'category_get_single',
    description: 'View single category',
    category: 'category',
    route: '/api/public/categories/:id',
    method: 'GET',
  },
  {
    name: 'category_post',
    description: 'Create category',
    category: 'category',
    route: '/api/public/categories',
    method: 'POST',
  },
  {
    name: 'category_put',
    description: 'Update category',
    category: 'category',
    route: '/api/public/categories/:id',
    method: 'PUT',
  },
  {
    name: 'category_delete',
    description: 'Delete category',
    category: 'category',
    route: '/api/public/categories/:id',
    method: 'DELETE',
  },
];
