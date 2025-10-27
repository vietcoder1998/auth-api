import { PrismaClient, PromptHistory as PrismaPromptHistory } from '@prisma/client';

export type PromptHistoryModel = PrismaClient['promptHistory'];

export interface PromptHistoryDro extends Omit<PrismaPromptHistory, 'id' | 'createdAt' | 'updatedAt'> {}
export interface PromptHistoryDto extends PromptHistoryDro {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
