import { PrismaClient, Billing as PrismaBilling } from '@prisma/client';

export type BillingModel = PrismaClient['billing'];

export interface BillingDro extends Omit<PrismaBilling, 'id' | 'createdAt' | 'updatedAt'> {}
export interface BillingDto extends BillingDro {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
