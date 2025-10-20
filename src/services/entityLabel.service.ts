import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class EntityLabelService {
  /**
   * Add labels to an entity
   */
  static async addLabelsToEntity(entityId: string, entityType: string, labelIds: string[]) {
    const data = labelIds.map((labelId) => ({
      entityId,
      entityType,
      labelId,
    }));

    return await prisma.entityLabel.createMany({
      data,
      skipDuplicates: true,
    });
  }

  /**
   * Remove labels from an entity
   */
  static async removeLabelsFromEntity(entityId: string, entityType: string, labelIds?: string[]) {
    const where: any = {
      entityId,
      entityType,
    };

    if (labelIds && labelIds.length > 0) {
      where.labelId = { in: labelIds };
    }

    return await prisma.entityLabel.deleteMany({ where });
  }

  /**
   * Get all labels for an entity
   */
  static async getLabelsForEntity(entityId: string, entityType: string) {
    return await prisma.entityLabel.findMany({
      where: {
        entityId,
        entityType,
      },
      include: {
        label: true,
      },
    });
  }

  /**
   * Get all entities with a specific label
   */
  static async getEntitiesWithLabel(labelId: string, entityType?: string) {
    const where: any = { labelId };
    if (entityType) {
      where.entityType = entityType;
    }

    return await prisma.entityLabel.findMany({
      where,
      include: {
        label: true,
      },
    });
  }

  /**
   * Replace all labels for an entity
   */
  static async replaceEntityLabels(entityId: string, entityType: string, labelIds: string[]) {
    return await prisma.$transaction(async (tx) => {
      // Remove all existing labels
      await tx.entityLabel.deleteMany({
        where: {
          entityId,
          entityType,
        },
      });

      // Add new labels
      if (labelIds.length > 0) {
        const data = labelIds.map((labelId) => ({
          entityId,
          entityType,
          labelId,
        }));

        await tx.entityLabel.createMany({
          data,
        });
      }
    });
  }

  /**
   * Get entity count by label
   */
  static async getEntityCountByLabel(labelId: string) {
    const counts = await prisma.entityLabel.groupBy({
      by: ['entityType'],
      where: {
        labelId,
      },
      _count: {
        entityType: true,
      },
    });

    return counts.reduce(
      (acc, item) => {
        acc[item.entityType] = item._count.entityType;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  /**
   * Search entities by label names
   */
  static async searchEntitiesByLabelNames(labelNames: string[], entityType?: string) {
    const where: any = {
      label: {
        name: {
          in: labelNames,
        },
      },
    };

    if (entityType) {
      where.entityType = entityType;
    }

    return await prisma.entityLabel.findMany({
      where,
      include: {
        label: true,
      },
    });
  }
}

export const entityLabelService = EntityLabelService;
