import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const promptHistoryService = {
  async createPrompt(conversationId: string, prompt: string) {
    return prisma.promptHistory.create({
      data: { conversationId, prompt },
    });
  },

  async getPrompts(conversationId: string) {
    return prisma.promptHistory.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  },

  async getPromptById(id: string) {
    return prisma.promptHistory.findUnique({ where: { id } });
  },

  async updatePrompt(id: string, prompt: string) {
    return prisma.promptHistory.update({
      where: { id },
      data: { prompt },
    });
  },

  async deletePrompt(id: string) {
    return prisma.promptHistory.delete({ where: { id } });
  },

  async getAllPrompts() {
    return prisma.promptHistory.findMany({
      orderBy: { createdAt: 'asc' },
    });
  },
};
