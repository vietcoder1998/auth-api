import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { ConfigDto, ConfigModel } from '../interfaces';

export class ConfigRepository extends BaseRepository<ConfigModel, ConfigDto, ConfigDto> {
    constructor(configDelegate = prisma.config) {
        super(configDelegate);
    }

    async findByKey(key: string) {
        return this.model.findFirst({ where: { key } });
    }

    async findByCategory(category: string) {
        return this.model.findMany({ where: { category } });
    }
}
