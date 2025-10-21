import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// Get all blogs (optionally filter by category or search)
router.get('/blogs', async (req, res) => {
  const { category, search } = req.query;
  const where: any = {};
  if (category) where.category = { name: category };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }
  const blogs = await prisma.blog.findMany({
    where,
    include: { category: true },
    orderBy: { date: 'desc' },
  });
  res.json(blogs);
});

// Get single blog by id
router.get('/blogs/:id', async (req, res) => {
  const blog = await prisma.blog.findUnique({
    where: { id: req.params.id },
    include: { category: true },
  });
  if (!blog) return res.status(404).json({ error: 'Blog not found' });
  res.json(blog);
});

// Get all categories
router.get('/categories', async (req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  res.json(categories);
});

// Get blogs by category id
router.get('/categories/:id/blogs', async (req, res) => {
  const blogs = await prisma.blog.findMany({
    where: { categoryId: req.params.id },
    include: { category: true },
    orderBy: { date: 'desc' },
  });
  res.json(blogs);
});

// Create blog (public, no auth)
router.post('/blogs', async (req, res) => {
  const { title, content, categoryId, author } = req.body;
  if (!title || !content || !categoryId) return res.status(400).json({ error: 'Missing fields' });
  const blog = await prisma.blog.create({
    data: { title, content, categoryId, author },
  });
  res.status(201).json(blog);
});

// Update blog (public, no auth)
router.put('/blogs/:id', async (req, res) => {
  const { title, content, categoryId, author } = req.body;
  const blog = await prisma.blog.update({
    where: { id: req.params.id },
    data: { title, content, categoryId, author },
  });
  res.json(blog);
});

// Delete blog (public, no auth)
router.delete('/blogs/:id', async (req, res) => {
  await prisma.blog.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// Create category (public, no auth)
router.post('/categories', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  const category = await prisma.category.create({ data: { name } });
  res.status(201).json(category);
});

// Update category (public, no auth)
router.put('/categories/:id', async (req, res) => {
  const { name } = req.body;
  const category = await prisma.category.update({ where: { id: req.params.id }, data: { name } });
  res.json(category);
});

// Delete category (public, no auth)
router.delete('/categories/:id', async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
