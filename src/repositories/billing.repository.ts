import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { BillingDto, BillingModel } from '../interfaces';

export class BillingRepository extends BaseRepository<BillingModel, BillingDto, BillingDto> {
    constructor(billingDelegate = prisma.billing) {
        super(billingDelegate);
    }
    // Add custom methods for Billing if needed
}
