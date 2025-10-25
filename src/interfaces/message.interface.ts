import { PrismaClient, Message as PrismaMessage } from '@prisma/client';

export type MessageModel = PrismaClient['message'];

export interface MessageDro extends Omit<PrismaMessage, 'id' | 'createdAt' | 'updatedAt'> {}
export interface MessageDto extends MessageDro {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
