import { PrismaClient, Faq as PrismaFaq } from '@prisma/client';

export type FaqModel = PrismaClient['faq'];

export interface FaqDro extends Omit<PrismaFaq, 'id' | 'createdAt' | 'updatedAt'> {}
export interface FaqDto extends FaqDro {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
