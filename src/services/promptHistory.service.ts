import { PrismaClient } from '@prisma/client';
import { BaseService } from './base.service';
import { PromptHistoryRepository } from '../repositories/prompthistory.repository';
import { PromptHistoryDto } from '../interfaces';

const prisma = new PrismaClient();

export class PromptHistoryService extends BaseService<any, PromptHistoryDto, PromptHistoryDto> {
  private promptHistoryRepository: PromptHistoryRepository;

  constructor() {
    const promptHistoryRepository = new PromptHistoryRepository();
    super(promptHistoryRepository);
    this.promptHistoryRepository = promptHistoryRepository;
  }

  async createPrompt(conversationId: string, prompt: string) {
    return this.promptHistoryRepository.create({ conversationId, prompt } as any);
  }

  async getPrompts(conversationId: string) {
    return this.promptHistoryRepository.findByConversationId(conversationId);
  }

  async getPromptById(id: string) {
    return this.promptHistoryRepository.findById(id);
  }

  async updatePrompt(id: string, prompt: string) {
    return this.promptHistoryRepository.update(id, { prompt } as any);
  }

  async deletePrompt(id: string) {
    return this.promptHistoryRepository.delete(id);
  }
  async getAllPrompts() {
    return prisma.promptHistory.findMany({ orderBy: { createdAt: 'asc' } });
  }
}

export const promptHistoryService = new PromptHistoryService();
