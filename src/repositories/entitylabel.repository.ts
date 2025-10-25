import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { EntityLabelDto, EntityLabelModel } from '../interfaces';

export class EntityLabelRepository extends BaseRepository<EntityLabelModel, EntityLabelDto, EntityLabelDto> {
    constructor(entityLabelDelegate: any = prisma.entityLabel) {
        super(entityLabelDelegate);
    }

    async findByEntity(entityId: string, entityType: string) {
        return (this.model as any).findMany({ 
            where: { entityId, entityType },
            include: { label: true }
        });
    }

    async findByLabel(labelId: string, entityType?: string) {
        const where: any = { labelId };
        if (entityType) where.entityType = entityType;
        return (this.model as any).findMany({ where, include: { label: true } });
    }

    async deleteByEntity(entityId: string, entityType: string, labelIds?: string[]) {
        const where: any = { entityId, entityType };
        if (labelIds && labelIds.length > 0) where.labelId = { in: labelIds };
        return (this.model as any).deleteMany({ where });
    }
}
