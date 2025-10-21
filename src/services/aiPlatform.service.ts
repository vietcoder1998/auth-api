import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const createAIPlatform = async (data: any) => {
  return prisma.aIPlatform.create({ data });
};

export const getAIPlatforms = async () => {
  return prisma.aIPlatform.findMany();
};

export const getAIPlatformById = async (id: string) => {
  return prisma.aIPlatform.findUnique({ where: { id } });
};

export const updateAIPlatform = async (id: string, data: any) => {
  return prisma.aIPlatform.update({ where: { id }, data });
};

export const deleteAIPlatform = async (id: string) => {
  return prisma.aIPlatform.delete({ where: { id } });
};
