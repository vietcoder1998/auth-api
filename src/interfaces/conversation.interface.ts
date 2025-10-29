import { PrismaClient, Conversation as PrismaConversation } from '@prisma/client';

export type ConversationModel = PrismaClient['conversation'];

export interface ConversationDto extends Partial<PrismaConversation> {}
export interface ConversationDro extends ConversationDto {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
