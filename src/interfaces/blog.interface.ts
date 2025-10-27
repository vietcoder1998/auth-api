import { PrismaClient, Blog as PrismaBlog } from '@prisma/client';

export type BlogModel = PrismaClient['blog'];

export interface BlogDro extends Omit<PrismaBlog, 'id' | 'createdAt' | 'updatedAt'> {}
export interface BlogDto extends BlogDro {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
