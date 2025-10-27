import { PrismaClient, Category as PrismaCategory } from '@prisma/client';

export type CategoryModel = PrismaClient['category'];

export interface CategoryDro extends Omit<PrismaCategory, 'id' | 'createdAt' | 'updatedAt'> {}
export interface CategoryDto extends CategoryDro {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
