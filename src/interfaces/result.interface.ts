import { PrismaClient, ResultType } from '@prisma/client';

export interface IResult extends Partial<PrismaClient['result']> {
  id: string;
  content?: string;
  toolId?: string;
  resultType?: ResultType;
  createdAt: Date;
}
