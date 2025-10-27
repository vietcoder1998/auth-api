import { PrismaClient, Label as PrismaLabel } from '@prisma/client';

export type LabelModel = PrismaClient['label'];

export interface LabelDro extends Omit<PrismaLabel, 'id' | 'createdAt' | 'updatedAt'> {}
export interface LabelDto extends LabelDro {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
