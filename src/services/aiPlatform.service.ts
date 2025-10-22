import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const createAIPlatform = async (data: any) => {
  const { aiModelIds, ...rest } = data;
  return prisma.aIPlatform.create({
    data: {
      ...rest,
      models: aiModelIds && Array.isArray(aiModelIds)
        ? { connect: aiModelIds.map((id: string) => ({ id })) }
        : undefined,
    },
  });
};

export const getAIPlatforms = async () => {
  return prisma.aIPlatform.findMany();
};

export const getAIPlatformById = async (id: string) => {
  return prisma.aIPlatform.findUnique({ where: { id } });
};

export const updateAIPlatform = async (id: string, data: any) => {
  const { aiModelIds, ...rest } = data;
  return prisma.aIPlatform.update({
    where: { id },
    data: {
      ...rest,
      models: aiModelIds && Array.isArray(aiModelIds)
        ? { set: aiModelIds.map((id: string) => ({ id })) }
        : undefined,
    },
  });
};

export const deleteAIPlatform = async (id: string) => {
  return prisma.aIPlatform.delete({ where: { id } });
};
