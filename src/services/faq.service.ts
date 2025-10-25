import { PrismaClient } from '@prisma/client';
import { BaseService } from './base.service';
import { FaqRepository } from '../repositories/faq.repository';
import { FaqDto } from '../interfaces';

const prisma = new PrismaClient();

export class FaqService extends BaseService<any, FaqDto, FaqDto> {
  private faqRepository: FaqRepository;

  constructor() {
    const faqRepository = new FaqRepository();
    super(faqRepository);
    this.faqRepository = faqRepository;
  }
  async listFaqs(q?: string) {
    if (q && typeof q === 'string' && q.trim()) {
      return this.faqRepository.searchByQuery(q);
    }
    return prisma.faq.findMany({
      orderBy: { createdAt: 'desc' },
      include: { prompt: true, conversation: true, agent: true },
    });
  }

  async getFaq(id: string) {
    return this.faqRepository.findById(id);
  }

  async createFaq(data: any) {
    return this.faqRepository.create(data);
  }

  async updateFaq(id: string, data: any) {
    const { question, answer, type, promptId, conversationId, aiAgentId, createdAt, updatedAt, description } = data;
    return this.faqRepository.update(id, { question, answer, type, promptId, conversationId, aiAgentId, createdAt, updatedAt, description });
  }

  async deleteFaq(id: string) {
    return this.faqRepository.delete(id);
  }
}

export const faqService = new FaqService();
