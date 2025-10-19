import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// List documents by type
export async function listDocuments(req: Request, res: Response) {
  const { type } = req.query;
  try {
    const docs = await prisma.file.findMany({
      where: type ? { type: String(type) } : {},
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}

// Get document by id
export async function getDocument(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const doc = await prisma.file.findUnique({ where: { id } });
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}

// Create document (metadata only)
export async function createDocument(req: Request, res: Response) {
  try {
    const doc = await prisma.file.create({ data: req.body });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}

// Update document
export async function updateDocument(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const doc = await prisma.file.update({ where: { id }, data: req.body });
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}

// Delete document
export async function deleteDocument(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await prisma.file.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}
