import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { PromptTemplateDto, PromptTemplateModel } from '../interfaces';

export class PromptTemplateRepository extends BaseRepository<PromptTemplateModel, PromptTemplateDto, PromptTemplateDto> {
    constructor(promptTemplateDelegate = prisma.promptTemplate) {
        super(promptTemplateDelegate);
    }

    async findByName(name: string) {
        return this.model.findFirst({ where: { name } });
    }

    async findByType(type: string) {
        return this.model.findMany({ where: { type } });
    }
}
