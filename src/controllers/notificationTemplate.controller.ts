import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function getNotificationTemplates() {
  return prisma.notificationTemplate.findMany();
}

export async function getNotificationTemplate(id: string) {
  return prisma.notificationTemplate.findUnique({ where: { id } });
}

export async function createNotificationTemplate(data: {
  name: string;
  title: string;
  body: string;
  active?: boolean;
}) {
  return prisma.notificationTemplate.create({ data });
}

export async function updateNotificationTemplate(id: string, data: Partial<{
  name: string;
  title: string;
  body: string;
  active: boolean;
}>) {
  return prisma.notificationTemplate.update({ where: { id }, data });
}

export async function deleteNotificationTemplate(id: string) {
  return prisma.notificationTemplate.delete({ where: { id } });
}
