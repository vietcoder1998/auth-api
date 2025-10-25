import { PrismaClient, Conversation as PrismaConversation } from '@prisma/client';

export type ConversationModel = PrismaClient['conversation'];

export interface ConversationDro extends Omit<PrismaConversation, 'id' | 'createdAt' | 'updatedAt'> {}
export interface ConversationDto extends ConversationDro {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
