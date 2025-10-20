import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function listFaqs(req: Request, res: Response) {
  try {
    const { q } = req.query;
    const where: any = {};
    if (q && typeof q === 'string' && q.trim()) {
      where.OR = [
        { question: { contains: q, mode: 'insensitive' } },
        { answer: { contains: q, mode: 'insensitive' } },
        { type: { contains: q, mode: 'insensitive' } },
      ];
    }
    const faqs = await prisma.faq.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        prompt: true,
        conversation: true,
        agent: true,
      },
    });
    res.json({ success: true, data: faqs });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}

export async function getFaq(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const faq = await prisma.faq.findUnique({ where: { id } });
    if (!faq) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: faq });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}

export async function createFaq(req: Request, res: Response) {
  try {
    const faq = await prisma.faq.create({ data: req.body });
    res.status(201).json({ success: true, data: faq });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}

export async function updateFaq(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const faq = await prisma.faq.update({ where: { id }, data: req.body });
    res.json({ success: true, data: faq });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}

export async function deleteFaq(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await prisma.faq.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}
