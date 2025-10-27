import { PrismaClient } from '@prisma/client';
import { BaseService } from './base.service';
import { BillingRepository } from '../repositories/billing.repository';
import { BillingDto } from '../interfaces';

const prisma = new PrismaClient();

export class BillingService extends BaseService<any, BillingDto, BillingDto> {
  private billingRepository: BillingRepository;

  constructor() {
    const billingRepository = new BillingRepository();
    super(billingRepository);
    this.billingRepository = billingRepository;
  }

  async getBillings() {
    return prisma.billing.findMany({ include: { aiKey: true, conversation: true } });
  }

  async getBillingById(id: string) {
    return prisma.billing.findUnique({ where: { id }, include: { aiKey: true, conversation: true } });
  }
}

const billingService = new BillingService();

export const createBilling = async (data: any) => billingService.create(data);
export const getBillings = async () => billingService.getBillings();
export const getBillingById = async (id: string) => billingService.getBillingById(id);
export const updateBilling = async (id: string, data: any) => billingService.update(id, data);
export const deleteBilling = async (id: string) => billingService.delete(id);
