import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { AIPlatformDto, AIPlatformModel } from '../interfaces';

export class AIPlatformRepository extends BaseRepository<AIPlatformModel, AIPlatformDto, AIPlatformDto> {
    constructor(aiPlatformDelegate = prisma.aIPlatform) {
        super(aiPlatformDelegate);
    }

    async findByName(name: string) {
        return this.model.findFirst({ where: { name } });
    }

    async findWithKeys(id: string) {
        return this.model.findUnique({
            where: { id },
            include: {
                apiKeys: true,
                models: true
            }
        });
    }
}
