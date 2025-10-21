// Mock data for seeding blog and category

export const mockCategories = [
  {
    id: 'cat-001',
    name: 'Tech',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  },
  {
    id: 'cat-002',
    name: 'Life',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  },
];

export const mockBlogs = [
  {
    id: 'blog-001',
    title: 'Welcome to the Tech Blog',
    content: 'This is the first post in the Tech category.',
    date: new Date('2025-01-02T00:00:00Z'),
    categoryId: 'cat-001',
    author: 'Admin',
    createdAt: new Date('2025-01-02T00:00:00Z'),
    updatedAt: new Date('2025-01-02T00:00:00Z'),
  },
  {
    id: 'blog-002',
    title: 'Life Update',
    content: 'Sharing some thoughts on life.',
    date: new Date('2025-01-03T00:00:00Z'),
    categoryId: 'cat-002',
    author: 'User',
    createdAt: new Date('2025-01-03T00:00:00Z'),
    updatedAt: new Date('2025-01-03T00:00:00Z'),
  },
];
