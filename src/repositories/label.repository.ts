import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { LabelDto, LabelModel } from '../interfaces';

export class LabelRepository extends BaseRepository<LabelModel, LabelDto, LabelDto> {
    constructor(labelDelegate = prisma.label) {
        super(labelDelegate);
    }

    async findByName(name: string) {
        return this.model.findFirst({ where: { name } });
    }

    async findAll() {
        return this.model.findMany({ orderBy: { name: 'asc' } });
    }
}
