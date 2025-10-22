import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class FaqService {
  async listFaqs(q?: string) {
    const where: any = {};
    if (q && typeof q === 'string' && q.trim()) {
      where.OR = [
        { question: { contains: q, mode: 'insensitive' } },
        { answer: { contains: q, mode: 'insensitive' } },
        { type: { contains: q, mode: 'insensitive' } },
      ];
    }
    return prisma.faq.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        prompt: true,
        conversation: true,
        agent: true,
      },
    });
  }

  async getFaq(id: string) {
    return prisma.faq.findUnique({ where: { id } });
  }

  async createFaq(data: any) {
    return prisma.faq.create({ data });
  }

  async updateFaq(id: string, data: any) {
    // Only allow scalar fields and relation IDs
    const {
      question,
      answer,
      type,
      promptId,
      conversationId,
      aiAgentId,
      createdAt,
      updatedAt,
      description,
    } = data;
    return prisma.faq.update({
      where: { id },
      data: {
        question,
        answer,
        type,
        promptId,
        conversationId,
        aiAgentId,
        createdAt,
        updatedAt,
        description,
      },
    });
  }

  async deleteFaq(id: string) {
    return prisma.faq.delete({ where: { id } });
  }
}

export const faqService = new FaqService();
