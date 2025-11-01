import {
  MessageDro,
  MessageDto,
  MessageFilters,
  MessageModel,
} from '../interfaces/message.interface';
import { prisma } from './../setup';
import { BaseRepository } from './base.repository';

export class MessageRepository extends BaseRepository<MessageModel, MessageDto, MessageDro> {
  constructor(messageDelegate = prisma.message) {
    super(messageDelegate);
  }

  get messageModel(): MessageModel {
    if (!this.model) {
      throw new Error('Message model is not defined');
    }
    return this.model as MessageModel;
  }

  /**
   * Find messages by conversation ID
   * @param conversationId - The conversation ID
   * @param includeRelations - Whether to include user and conversation relations
   * @returns Array of messages for the conversation
   */
  async findByConversationId(conversationId: string, includeRelations: boolean = false) {
    return this.messageModel.findMany({
      where: { conversationId },
      include: includeRelations
        ? {
            conversation: true,
            promptHistory: true,
            faq: true,
          }
        : undefined,
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Find messages by sender
   * @param sender - The sender (user, agent, system)
   * @param includeRelations - Whether to include conversation relation
   * @returns Array of messages for the sender
   */
  async findBySender(sender: string, includeRelations: boolean = false) {
    return this.messageModel.findMany({
      where: { sender },
      include: includeRelations
        ? {
            conversation: true,
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find messages by agent ID (legacy method)
   * @param agentId - The agent ID
   * @returns Array of messages for the agent
   */
  async findByAgentId(agentId: string) {
    return this.messageModel.findMany({
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

    if (filters.sender) {
      where.sender = filters.sender;
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

    return this.messageModel.findMany({
      where,
      include: includeRelations
        ? {
            conversation: true,
            promptHistory: true,
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get conversation message count
   * @param conversationId - The conversation ID
   * @returns Message count for the conversation
   */
  async countByConversationId(conversationId: string): Promise<number> {
    return this.messageModel.count({
      where: { conversationId },
    });
  }

  /**
   * Get latest message in conversation
   * @param conversationId - The conversation ID
   * @returns Latest message or null
   */
  async getLatestMessageInConversation(conversationId: string) {
    return this.messageModel.findFirst({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      include: {
        conversation: true,
      },
    });
  }

  /**
   * Get recent messages in conversation
   * @param conversationId - The conversation ID
   * @param take - Number of messages to fetch (default: 10)
   * @returns Recent messages in descending order
   */
  async getRecentMessagesInConversation(conversationId: string, take: number = 10) {
    return this.messageModel.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  /**
   * Delete all messages in a conversation
   * @param conversationId - The conversation ID
   * @returns Delete result with count
   */
  async deleteByConversationId(conversationId: string): Promise<{ count: number }> {
    return this.messageModel.deleteMany({
      where: { conversationId },
    });
  }

  /**
   * Delete all messages by sender
   * @param sender - The sender identifier
   * @returns Delete result with count
   */
  async deleteBySender(sender: string): Promise<{ count: number }> {
    return this.messageModel.deleteMany({
      where: { sender },
    });
  }

  /**
   * Find messages by user ID (through conversation relationship)
   * @param userId - The user ID
   * @param includeRelations - Whether to include conversation relation
   * @returns Array of messages for the user
   */
  async findByUserId(userId: string, includeRelations: boolean = false) {
    return (this.model as any).findMany({
      where: {
        conversation: {
          userId: userId,
        },
      },
      include: includeRelations ? {
        conversation: true,
        promptHistory: true,
        faq: true,
      } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete all messages by user ID (through conversation relationship)
   * @param userId - The user ID
   * @returns Delete result with count
   */
  async deleteByUserId(userId: string): Promise<{ count: number }> {
    return (this.model as any).deleteMany({
      where: {
        conversation: {
          userId: userId,
        },
      },
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
      this.messageModel.findMany({
        where: { conversationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          conversation: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      this.messageModel.count({
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
    return this.messageModel.update({
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

    return this.messageModel.findMany({
      where,
      include: {
        conversation: {
          select: {
            id: true,
            title: true,
          },
        },
        promptHistory: true,
        faq: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const messageRepository = new MessageRepository();
