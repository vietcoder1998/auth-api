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

    // Note: Config model doesn't have category field in schema
    // Removed findByCategory method as it doesn't exist in Prisma schema
}
