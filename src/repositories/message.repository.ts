import { MessageDro, MessageDto, MessageModel, MessageFilters } from '../interfaces/message.interface';
import { prisma } from '../setup';
import { BaseRepository } from './base.repository';

export class MessageRepository extends BaseRepository<any, MessageDto, MessageDro> {
  constructor(messageDelegate = prisma.message) {
    super(messageDelegate);
  }

  /**
   * Find messages by conversation ID
   * @param conversationId - The conversation ID
   * @param includeRelations - Whether to include user and conversation relations
   * @returns Array of messages for the conversation
   */
  async findByConversationId(conversationId: string, includeRelations: boolean = false) {
    return this.model.findMany({
      where: { conversationId },
      include: includeRelations ? {
        user: true,
        conversation: true,
      } : undefined,
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Find messages by user ID
   * @param userId - The user ID
   * @param includeRelations - Whether to include conversation relation
   * @returns Array of messages for the user
   */
  async findByUserId(userId: string, includeRelations: boolean = false) {
    return this.model.findMany({
      where: { userId },
      include: includeRelations ? {
        conversation: true,
      } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find messages by agent ID (legacy method)
   * @param agentId - The agent ID
   * @returns Array of messages for the agent
   */
  async findByAgentId(agentId: string) {
    return this.model.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find messages with filters
   * @param filters - Message filter criteria
   * @param includeRelations - Whether to include relations
   * @returns Array of filtered messages
   */
  async findWithFilters(filters: MessageFilters, includeRelations: boolean = false) {
    const where: any = {};

    if (filters.conversationId) {
      where.conversationId = filters.conversationId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.createdAfter || filters.createdBefore) {
      where.createdAt = {};
      if (filters.createdAfter) {
        where.createdAt.gte = filters.createdAfter;
      }
      if (filters.createdBefore) {
        where.createdAt.lte = filters.createdBefore;
      }
    }

    return this.model.findMany({
      where,
      include: includeRelations ? {
        user: true,
        conversation: true,
      } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get conversation message count
   * @param conversationId - The conversation ID
   * @returns Message count for the conversation
   */
  async countByConversationId(conversationId: string): Promise<number> {
    return this.model.count({
      where: { conversationId },
    });
  }

  /**
   * Get latest message in conversation
   * @param conversationId - The conversation ID
   * @returns Latest message or null
   */
  async getLatestMessageInConversation(conversationId: string) {
    return this.model.findFirst({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
      },
    });
  }

  /**
   * Delete all messages in a conversation
   * @param conversationId - The conversation ID
   * @returns Delete result with count
   */
  async deleteByConversationId(conversationId: string): Promise<{ count: number }> {
    return this.model.deleteMany({
      where: { conversationId },
    });
  }

  /**
   * Delete all messages by user
   * @param userId - The user ID
   * @returns Delete result with count
   */
  async deleteByUserId(userId: string): Promise<{ count: number }> {
    return this.model.deleteMany({
      where: { userId },
    });
  }

  /**
   * Get messages with pagination
   * @param conversationId - The conversation ID
   * @param page - Page number (1-based)
   * @param limit - Number of messages per page
   * @returns Paginated messages
   */
  async getPaginatedMessages(conversationId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.model.findMany({
        where: { conversationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.model.count({
        where: { conversationId },
      }),
    ]);

    return {
      messages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update message metadata
   * @param id - Message ID
   * @param metadata - Metadata to update
   * @returns Updated message
   */
  async updateMetadata(id: string, metadata: Record<string, any>) {
    return this.model.update({
      where: { id },
      data: {
        metadata: JSON.stringify(metadata),
      },
    });
  }

  /**
   * Find messages containing specific text
   * @param searchText - Text to search for
   * @param conversationId - Optional conversation ID to limit search
   * @returns Array of matching messages
   */
  async searchMessages(searchText: string, conversationId?: string) {
    const where: any = {
      content: {
        contains: searchText,
        mode: 'insensitive',
      },
    };

    if (conversationId) {
      where.conversationId = conversationId;
    }

    return this.model.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        conversation: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const messageRepository = new MessageRepository();
