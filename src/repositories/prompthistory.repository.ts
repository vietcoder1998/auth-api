import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { PromptHistoryDto, PromptHistoryModel } from '../interfaces';

export class PromptHistoryRepository extends BaseRepository<PromptHistoryModel, PromptHistoryDto, PromptHistoryDto> {
    constructor(promptHistoryDelegate = prisma.promptHistory) {
        super(promptHistoryDelegate);
    }

    async findByConversationId(conversationId: string) {
        return this.model.findMany({ 
            where: { conversationId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findByTemplateId(templateId: string) {
        return this.model.findMany({ 
            where: { templateId },
            orderBy: { createdAt: 'desc' }
        });
    }
}
