import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const createAIKey = async (data: any) => {
  return prisma.aIKey.create({ data });
};


export const getAIKeys = async () => {
  return prisma.aIKey.findMany({
    include: {
      platform: true,
      billing: true,
      agents: {
        include: {
          agent: true
        }
      },
      Conversation: true,
      user: true
    }
  });
};

export const getAIKeyById = async (id: string) => {
  return prisma.aIKey.findUnique({ where: { id }, include: { platform: true, billing: true } });
};

export const updateAIKey = async (id: string, data: any) => {
  return prisma.aIKey.update({ where: { id }, data });
};

export const deleteAIKey = async (id: string) => {
  return prisma.aIKey.delete({ where: { id } });
};
