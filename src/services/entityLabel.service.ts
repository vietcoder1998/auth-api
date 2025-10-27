import { PrismaClient } from '@prisma/client';
import { BaseService } from './base.service';
import { EntityLabelRepository } from '../repositories/entitylabel.repository';
import { EntityLabelDto } from '../interfaces';

const prisma = new PrismaClient();

export class EntityLabelService extends BaseService<any, EntityLabelDto, EntityLabelDto> {
  private entityLabelRepository: EntityLabelRepository;

  constructor() {
    const entityLabelRepository = new EntityLabelRepository();
    super(entityLabelRepository);
    this.entityLabelRepository = entityLabelRepository;
  }

  static async addLabelsToEntity(entityId: string, entityType: string, labelIds: string[]) {
    const data = labelIds.map((labelId) => ({ entityId, entityType, labelId }));
    return await prisma.entityLabel.createMany({ data, skipDuplicates: true });
  }

  static async removeLabelsFromEntity(entityId: string, entityType: string, labelIds?: string[]) {
    const service = new EntityLabelService();
    return service.entityLabelRepository.deleteByEntity(entityId, entityType, labelIds);
  }

  static async getLabelsForEntity(entityId: string, entityType: string) {
    const service = new EntityLabelService();
    return service.entityLabelRepository.findByEntity(entityId, entityType);
  }

  static async getEntitiesWithLabel(labelId: string, entityType?: string) {
    const service = new EntityLabelService();
    return service.entityLabelRepository.findByLabel(labelId, entityType);
  }

  static async replaceEntityLabels(entityId: string, entityType: string, labelIds: string[]) {
    return await prisma.$transaction(async (tx) => {
      await tx.entityLabel.deleteMany({ where: { entityId, entityType } });
      if (labelIds.length > 0) {
        const data = labelIds.map((labelId) => ({ entityId, entityType, labelId }));
        await tx.entityLabel.createMany({ data });
      }
    });
  }

  static async getEntityCountByLabel(labelId: string) {
    const counts = await prisma.entityLabel.groupBy({
      by: ['entityType'],
      where: { labelId },
      _count: { entityType: true },
    });
    return counts.reduce((acc, item) => {
      acc[item.entityType] = item._count.entityType;
      return acc;
    }, {} as Record<string, number>);
  }

  static async searchEntitiesByLabelNames(labelNames: string[], entityType?: string) {
    const where: any = { label: { name: { in: labelNames } } };
    if (entityType) where.entityType = entityType;
    return await prisma.entityLabel.findMany({ where, include: { label: true } });
  }
}

export const entityLabelService = EntityLabelService;
