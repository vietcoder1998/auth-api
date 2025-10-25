import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { FaqDto, FaqModel } from '../interfaces';

export class FaqRepository extends BaseRepository<FaqModel, FaqDto, FaqDto> {
    constructor(faqDelegate = prisma.faq) {
        super(faqDelegate);
    }

    async findByCategory(category: string) {
        return this.model.findMany({ 
            where: { category },
            orderBy: { order: 'asc' }
        });
    }

    async findPublished() {
        return this.model.findMany({ 
            where: { isPublished: true },
            orderBy: { order: 'asc' }
        });
    }

    async search(query: string) {
        return this.model.findMany({
            where: {
                OR: [
                    { question: { contains: query } },
                    { answer: { contains: query } }
                ]
            },
            orderBy: { order: 'asc' }
        });
    }
}
