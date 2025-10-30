import { PromptHistory as PrismaPromptHistory } from '@prisma/client';

// PromptHistoryModel extends PrismaPromptHistory
export interface PromptHistoryModel extends PrismaPromptHistory {
  // Add any computed or virtual fields here if needed
}

// DTO for PromptHistory (for create/update operations)
export interface PromptHistoryDto extends PromptHistoryModel {}

// DRO for PromptHistory (for API responses, omitting timestamps)
export interface PromptHistoryDro extends Omit<PromptHistoryDto, 'createdAt' | 'updatedAt'> {}
