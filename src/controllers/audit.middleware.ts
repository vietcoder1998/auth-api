import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Middleware to update updatedAt on changes for NotificationTemplate
export async function updateNotificationTemplate(id: string, data: Partial<{
  name: string;
  title: string;
  body: string;
  active: boolean;
}>) {
  // Always update updatedAt
  return prisma.notificationTemplate.update({
    where: { id },
    data: { ...data, updatedAt: new Date() }
  });
}

// Similar for MailTemplate
export async function updateMailTemplate(id: string, data: Partial<{
  name: string;
  subject: string;
  body: string;
  active: boolean;
}>) {
  return prisma.mailTemplate.update({
    where: { id },
    data: { ...data, updatedAt: new Date() }
  });
}
