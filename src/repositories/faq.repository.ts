import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { FaqDto, FaqModel } from '../interfaces';

export class FaqRepository extends BaseRepository<FaqModel, FaqDto, FaqDto> {
    constructor(faqDelegate = prisma.faq) {
        super(faqDelegate);
    }

    // Note: Faq model doesn't have category or order fields in schema
    // Removed findByCategory and findPublished methods

    async searchByQuery(query: string) {
        return this.model.findMany({
            where: {
                OR: [
                    { question: { contains: query } },
                    { answer: { contains: query } }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}
