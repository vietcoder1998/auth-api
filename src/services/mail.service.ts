import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateMailData {
  to: string;
  from?: string;
  subject: string;
  body: string;
  templateId?: string;
}

export interface CreateMailTemplateData {
  name: string;
  subject: string;
  body: string;
  active?: boolean;
}

export interface UpdateMailTemplateData {
  name?: string;
  subject?: string;
  body?: string;
  active?: boolean;
}

export class MailService {
  /**
   * Create a mail template
   */
  async createTemplate(data: CreateMailTemplateData) {
    const { name, subject, body, active } = data;

    // Check if template with same name exists
    const existingTemplate = await prisma.mailTemplate.findUnique({
      where: { name },
    });

    if (existingTemplate) {
      throw new Error('Mail template with this name already exists');
    }

    const template = await prisma.mailTemplate.create({
      data: {
        name,
        subject,
        body,
        active: active ?? true,
      },
    });

    return template;
  }

  /**
   * Get mail template by ID
   */
  async getTemplateById(id: string) {
    const template = await prisma.mailTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { mails: true },
        },
      },
    });

    if (!template) {
      throw new Error('Mail template not found');
    }

    return template;
  }

  /**
   * Get mail template by name
   */
  async getTemplateByName(name: string) {
    const template = await prisma.mailTemplate.findUnique({
      where: { name },
    });

    if (!template) {
      throw new Error('Mail template not found');
    }

    return template;
  }

  /**
   * Update mail template
   */
  async updateTemplate(id: string, data: UpdateMailTemplateData) {
    const template = await prisma.mailTemplate.update({
      where: { id },
      data,
    });

    return template;
  }

  /**
   * Delete mail template
   */
  async deleteTemplate(id: string) {
    // Check if template is being used
    const mailsCount = await prisma.mail.count({
      where: { templateId: id },
    });

    if (mailsCount > 0) {
      throw new Error('Cannot delete template that has associated mails');
    }

    return await prisma.mailTemplate.delete({
      where: { id },
    });
  }

  /**
   * Get all mail templates
   */
  async getTemplates(page: number = 1, limit: number = 20, search?: string, active?: boolean) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [{ name: { contains: search } }, { subject: { contains: search } }];
    }

    if (active !== undefined) {
      where.active = active;
    }

    const [templates, total] = await Promise.all([
      prisma.mailTemplate.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { mails: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.mailTemplate.count({ where }),
    ]);

    return {
      data: templates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Send mail
   */
  async sendMail(data: CreateMailData) {
    const { to, from, subject, body, templateId } = data;

    let mailData: any = {
      to,
      from,
      subject,
      body,
      templateId,
      status: 'pending',
    };

    // If using template, get template data
    if (templateId) {
      const template = await this.getTemplateById(templateId);
      if (!template.active) {
        throw new Error('Cannot use inactive mail template');
      }

      // Override with template data if not provided
      mailData.subject = subject || template.subject;
      mailData.body = body || template.body;
    }

    const mail = await prisma.mail.create({
      data: mailData,
      include: {
        template: true,
      },
    });

    // Here you would integrate with actual email service (SendGrid, AWS SES, etc.)
    // For now, we'll just mark as sent
    try {
      // Simulate email sending
      await this.simulateEmailSending(mail);

      // Update status to sent
      const updatedMail = await prisma.mail.update({
        where: { id: mail.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
        include: {
          template: true,
        },
      });

      return updatedMail;
    } catch (error) {
      // Update status to failed
      const failedMail = await prisma.mail.update({
        where: { id: mail.id },
        data: {
          status: 'failed',
          failedReason: error instanceof Error ? error.message : 'Unknown error',
        },
        include: {
          template: true,
        },
      });

      throw new Error(
        `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Simulate email sending (replace with actual email service)
   */
  private async simulateEmailSending(mail: any) {
    // This is where you'd integrate with your email service
    console.log(`Sending email to ${mail.to}: ${mail.subject}`);

    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simulate occasional failure for testing
    if (Math.random() < 0.1) {
      throw new Error('Simulated email sending failure');
    }
  }

  /**
   * Get mail by ID
   */
  async getMailById(id: string) {
    const mail = await prisma.mail.findUnique({
      where: { id },
      include: {
        template: true,
      },
    });

    if (!mail) {
      throw new Error('Mail not found');
    }

    return mail;
  }

  /**
   * Get all mails
   */
  async getMails(page: number = 1, limit: number = 20, status?: string, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [{ to: { contains: search } }, { subject: { contains: search } }];
    }

    const [mails, total] = await Promise.all([
      prisma.mail.findMany({
        where,
        skip,
        take: limit,
        include: {
          template: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.mail.count({ where }),
    ]);

    return {
      data: mails,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retry failed mail
   */
  async retryMail(id: string) {
    const mail = await prisma.mail.findUnique({
      where: { id },
      include: { template: true },
    });

    if (!mail) {
      throw new Error('Mail not found');
    }

    if (mail.status !== 'failed') {
      throw new Error('Can only retry failed mails');
    }

    // Reset mail status
    const updatedMail = await prisma.mail.update({
      where: { id },
      data: {
        status: 'pending',
        failedReason: null,
      },
    });

    // Attempt to send again
    return await this.sendMail({
      to: mail.to,
      from: mail.from || undefined,
      subject: mail.subject,
      body: mail.body,
      templateId: mail.templateId || undefined,
    });
  }

  /**
   * Get mail statistics
   */
  async getMailStats() {
    const stats = await prisma.mail.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    const result = {
      total: 0,
      pending: 0,
      sent: 0,
      failed: 0,
    };

    stats.forEach((stat) => {
      result.total += stat._count.status;
      result[stat.status as keyof typeof result] = stat._count.status;
    });

    return result;
  }

  /**
   * Send mail using template
   */
  async sendMailWithTemplate(templateName: string, to: string, variables?: Record<string, string>) {
    const template = await this.getTemplateByName(templateName);

    let subject = template.subject;
    let body = template.body;

    // Replace variables in template
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
        body = body.replace(new RegExp(placeholder, 'g'), value);
      });
    }

    return await this.sendMail({
      to,
      subject,
      body,
      templateId: template.id,
    });
  }
}

export const mailService = new MailService();
