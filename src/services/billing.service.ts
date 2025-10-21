import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const createBilling = async (data: any) => {
  return prisma.billing.create({ data });
};

export const getBillings = async () => {
  return prisma.billing.findMany({ include: { aiKey: true, conversation: true } });
};

export const getBillingById = async (id: string) => {
  return prisma.billing.findUnique({ where: { id }, include: { aiKey: true, conversation: true } });
};

export const updateBilling = async (id: string, data: any) => {
  return prisma.billing.update({ where: { id }, data });
};

export const deleteBilling = async (id: string) => {
  return prisma.billing.delete({ where: { id } });
};
