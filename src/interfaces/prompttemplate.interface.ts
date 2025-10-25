import { PrismaClient, PromptTemplate as PrismaPromptTemplate } from '@prisma/client';

export type PromptTemplateModel = PrismaClient['promptTemplate'];

export interface PromptTemplateDro extends Omit<PrismaPromptTemplate, 'id' | 'createdAt' | 'updatedAt'> {}
export interface PromptTemplateDto extends PromptTemplateDro {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
