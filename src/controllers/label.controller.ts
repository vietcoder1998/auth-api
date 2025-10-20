import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export class LabelController {
  // Get all labels
  async getLabels(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where = search
        ? {
            OR: [
              { name: { contains: search as string } },
              { description: { contains: search as string } },
            ],
          }
        : {};

      const [labels, total] = await Promise.all([
        prisma.label.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                entityLabels: true,
              },
            },
          },
        }),
        prisma.label.count({ where }),
      ]);

      res.json({
        success: true,
        data: labels,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Error fetching labels:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch labels',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get label by ID
  async getLabelById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const label = await prisma.label.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              entityLabels: true,
            },
          },
          entityLabels: {
            select: {
              entityType: true,
            },
          },
        },
      });

      if (!label) {
        return res.status(404).json({
          success: false,
          message: 'Label not found',
        });
      }

      res.json({
        success: true,
        data: label,
      });
    } catch (error) {
      console.error('Error fetching label:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch label',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Create new label
  async createLabel(req: Request, res: Response) {
    try {
      const { name, description, color } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Label name is required',
        });
      }

      const label = await prisma.label.create({
        data: {
          name,
          description,
          color: color || '#007bff',
        },
      });

      res.status(201).json({
        success: true,
        data: label,
        message: 'Label created successfully',
      });
    } catch (error) {
      console.error('Error creating label:', error);

      if (error instanceof Error && error.message.includes('Unique constraint')) {
        return res.status(409).json({
          success: false,
          message: 'A label with this name already exists',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create label',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Update label
  async updateLabel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, color } = req.body;

      const existingLabel = await prisma.label.findUnique({
        where: { id },
      });

      if (!existingLabel) {
        return res.status(404).json({
          success: false,
          message: 'Label not found',
        });
      }

      const label = await prisma.label.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(color && { color }),
        },
      });

      res.json({
        success: true,
        data: label,
        message: 'Label updated successfully',
      });
    } catch (error) {
      console.error('Error updating label:', error);

      if (error instanceof Error && error.message.includes('Unique constraint')) {
        return res.status(409).json({
          success: false,
          message: 'A label with this name already exists',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update label',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Delete label
  async deleteLabel(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const existingLabel = await prisma.label.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              entityLabels: true,
            },
          },
        },
      });

      if (!existingLabel) {
        return res.status(404).json({
          success: false,
          message: 'Label not found',
        });
      }

      // Check if label is in use
      const totalUsage = existingLabel._count.entityLabels;

      if (totalUsage > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete label. It is currently used by ${totalUsage} records.`,
          usage: { entityLabels: totalUsage },
        });
      }

      await prisma.label.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Label deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting label:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete label',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Bulk delete all data with specific label names
  async bulkDeleteByLabelNames(req: Request, res: Response) {
    try {
      const { labelNames, confirm } = req.body;

      if (!labelNames || !Array.isArray(labelNames) || labelNames.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'labelNames array is required and must not be empty',
        });
      }

      if (!confirm) {
        return res.status(400).json({
          success: false,
          message: 'This is a destructive operation. Please set confirm: true to proceed.',
        });
      }

      // Find labels that match the names
      const labels = await prisma.label.findMany({
        where: {
          name: {
            in: labelNames,
          },
        },
      });

      if (labels.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No labels found with the specified names',
        });
      }

      const labelIds = labels.map((label) => label.id);

      // Get all entity IDs that have these labels
      const entityLabels = await prisma.entityLabel.findMany({
        where: {
          labelId: { in: labelIds },
        },
        select: {
          entityId: true,
          entityType: true,
        },
      });

      // Group entity IDs by type
      const entitiesByType = entityLabels.reduce(
        (acc, el) => {
          if (!acc[el.entityType]) acc[el.entityType] = [];
          acc[el.entityType].push(el.entityId);
          return acc;
        },
        {} as Record<string, string[]>,
      );

      // Delete all related data in proper order (respecting foreign key constraints)
      const deletionResults = await prisma.$transaction(async (tx) => {
        const results: Record<string, number> = {};

        // Delete in reverse dependency order
        if (entitiesByType.message) {
          results.messages = (
            await tx.message.deleteMany({ where: { id: { in: entitiesByType.message } } })
          ).count;
        }
        if (entitiesByType.agentTask) {
          results.agentTasks = (
            await tx.agentTask.deleteMany({ where: { id: { in: entitiesByType.agentTask } } })
          ).count;
        }
        if (entitiesByType.agentTool) {
          results.agentTools = (
            await tx.agentTool.deleteMany({ where: { id: { in: entitiesByType.agentTool } } })
          ).count;
        }
        if (entitiesByType.agentMemory) {
          results.agentMemories = (
            await tx.agentMemory.deleteMany({ where: { id: { in: entitiesByType.agentMemory } } })
          ).count;
        }
        if (entitiesByType.conversation) {
          results.conversations = (
            await tx.conversation.deleteMany({ where: { id: { in: entitiesByType.conversation } } })
          ).count;
        }
        if (entitiesByType.agent) {
          results.agents = (
            await tx.agent.deleteMany({ where: { id: { in: entitiesByType.agent } } })
          ).count;
        }
        if (entitiesByType.logicHistory) {
          results.logicHistories = (
            await tx.logicHistory.deleteMany({ where: { id: { in: entitiesByType.logicHistory } } })
          ).count;
        }
        if (entitiesByType.loginHistory) {
          results.loginHistories = (
            await tx.loginHistory.deleteMany({ where: { id: { in: entitiesByType.loginHistory } } })
          ).count;
        }
        if (entitiesByType.apiUsageLog) {
          results.apiUsageLogs = (
            await tx.apiUsageLog.deleteMany({ where: { id: { in: entitiesByType.apiUsageLog } } })
          ).count;
        }
        if (entitiesByType.apiKey) {
          results.apiKeys = (
            await tx.apiKey.deleteMany({ where: { id: { in: entitiesByType.apiKey } } })
          ).count;
        }
        if (entitiesByType.mail) {
          results.mails = (
            await tx.mail.deleteMany({ where: { id: { in: entitiesByType.mail } } })
          ).count;
        }
        if (entitiesByType.sso) {
          results.ssos = (
            await tx.sSO.deleteMany({ where: { id: { in: entitiesByType.sso } } })
          ).count;
        }
        if (entitiesByType.token) {
          results.tokens = (
            await tx.token.deleteMany({ where: { id: { in: entitiesByType.token } } })
          ).count;
        }
        if (entitiesByType.user) {
          results.users = (
            await tx.user.deleteMany({ where: { id: { in: entitiesByType.user } } })
          ).count;
        }
        if (entitiesByType.mailTemplate) {
          results.mailTemplates = (
            await tx.mailTemplate.deleteMany({ where: { id: { in: entitiesByType.mailTemplate } } })
          ).count;
        }
        if (entitiesByType.notificationTemplate) {
          results.notificationTemplates = (
            await tx.notificationTemplate.deleteMany({
              where: { id: { in: entitiesByType.notificationTemplate } },
            })
          ).count;
        }
        if (entitiesByType.config) {
          results.configs = (
            await tx.config.deleteMany({ where: { id: { in: entitiesByType.config } } })
          ).count;
        }
        if (entitiesByType.permission) {
          results.permissions = (
            await tx.permission.deleteMany({ where: { id: { in: entitiesByType.permission } } })
          ).count;
        }
        if (entitiesByType.role) {
          results.roles = (
            await tx.role.deleteMany({ where: { id: { in: entitiesByType.role } } })
          ).count;
        }

        return results;
      });

      // Calculate total deleted records
      const totalDeleted = Object.values(deletionResults).reduce((sum, count) => sum + count, 0);

      res.json({
        success: true,
        message: `Successfully deleted ${totalDeleted} records across all tables`,
        deletedLabels: labels.map((l) => l.name),
        deletionBreakdown: deletionResults,
        totalDeleted,
      });
    } catch (error) {
      console.error('Error in bulk delete operation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk delete operation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get statistics about label usage
  async getLabelStatistics(req: Request, res: Response) {
    try {
      const labels = await prisma.label.findMany({
        include: {
          _count: {
            select: {
              entityLabels: true,
            },
          },
          entityLabels: {
            select: {
              entityType: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      const statistics = labels.map((label) => {
        const totalUsage = label._count.entityLabels;

        // Count usage by entity type
        const breakdown = label.entityLabels.reduce(
          (acc, el) => {
            acc[el.entityType] = (acc[el.entityType] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );

        return {
          id: label.id,
          name: label.name,
          description: label.description,
          color: label.color,
          totalUsage,
          breakdown,
          createdAt: label.createdAt,
        };
      });

      const overallStats = {
        totalLabels: labels.length,
        totalUsage: statistics.reduce((sum: number, stat) => sum + stat.totalUsage, 0),
        mostUsedLabel: statistics.reduce(
          (max, stat) => (stat.totalUsage > max.totalUsage ? stat : max),
          statistics[0] || null,
        ),
        unusedLabels: statistics.filter((stat) => stat.totalUsage === 0),
      };

      res.json({
        success: true,
        data: {
          labels: statistics,
          overall: overallStats,
        },
      });
    } catch (error) {
      console.error('Error fetching label statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch label statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
