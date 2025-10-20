import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateConversationData {
  userId: string;
  agentId: string;
  title?: string;
}

export interface UpdateConversationData {
  title?: string;
  summary?: string;
  isActive?: boolean;
}

export interface CreateMessageData {
  conversationId: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  metadata?: any;
  tokens?: number;
}

export class ConversationService {
  /**
   * Create a new conversation
   */
  async createConversation(data: CreateConversationData) {
    const { userId, agentId, title } = data;
    
    // Verify agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId }
    });
    
    if (!agent) {
      throw new Error('Agent not found or does not belong to user');
    }
    
    const conversation = await prisma.conversation.create({
      data: {
        userId,
        agentId,
        title: title || 'New Conversation'
      },
      include: {
        user: {
          select: { id: true, email: true, nickname: true }
        },
        agent: {
          select: { id: true, name: true, model: true, isActive: true }
        },
        _count: {
          select: { messages: true }
        }
      }
    });
    
    return conversation;
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(id: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, nickname: true }
        },
        agent: {
          select: { id: true, name: true, model: true, isActive: true }
        },
        messages: {
          orderBy: { position: 'asc' }
        },
        _count: {
          select: { messages: true }
        }
      }
    });
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    // Parse message metadata
    const parsedConversation = {
      ...conversation,
      messages: conversation.messages.map(message => ({
        ...message,
        metadata: message.metadata ? JSON.parse(message.metadata) : null
      }))
    };
    
    return parsedConversation;
  }

  /**
   * Update conversation
   */
  async updateConversation(id: string, data: UpdateConversationData) {
    const conversation = await prisma.conversation.update({
      where: { id },
      data,
      include: {
        user: {
          select: { id: true, email: true, nickname: true }
        },
        agent: {
          select: { id: true, name: true, model: true, isActive: true }
        },
        _count: {
          select: { messages: true }
        }
      }
    });
    
    return conversation;
  }

  /**
   * Delete conversation
   */
  async deleteConversation(id: string) {
    return await prisma.conversation.delete({
      where: { id }
    });
  }

  /**
   * Get user conversations
   */
  async getUserConversations(userId: string, agentId?: string, page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = { userId };
    
    if (agentId) {
      where.agentId = agentId;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { summary: { contains: search } },
        {
          messages: {
            some: {
              content: { contains: search }
            }
          }
        }
      ];
    }
    
    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        include: {
          agent: {
            select: { id: true, name: true, model: true, isActive: true }
          },
          _count: {
            select: { messages: true }
          }
        },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.conversation.count({ where })
    ]);
    
    return {
      data: conversations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Add message to conversation
   */
  async addMessage(data: CreateMessageData) {
    const { conversationId, sender, content, metadata, tokens } = data;
    
    // Get current message count for position
    const messageCount = await prisma.message.count({
      where: { conversationId }
    });
    
    const message = await prisma.message.create({
      data: {
        conversationId,
        sender,
        content,
        metadata: metadata ? JSON.stringify(metadata) : null,
        position: messageCount
      }
    });
    
    // Update conversation's updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });
    
    return {
      ...message,
      metadata: message.metadata ? JSON.parse(message.metadata) : null
    };
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(conversationId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        skip,
        take: limit,
        orderBy: { position: 'asc' }
      }),
      prisma.message.count({ where: { conversationId } })
    ]);
    
    // Parse metadata
    const parsedMessages = messages.map(message => ({
      ...message,
      metadata: message.metadata ? JSON.parse(message.metadata) : null
    }));
    
    return {
      data: parsedMessages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Update message
   */
  async updateMessage(messageId: string, content: string, metadata?: any) {
    const updateData: any = { content };
    
    if (metadata) {
      updateData.metadata = JSON.stringify(metadata);
    }
    
    const message = await prisma.message.update({
      where: { id: messageId },
      data: updateData
    });
    
    return {
      ...message,
      metadata: message.metadata ? JSON.parse(message.metadata) : null
    };
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string) {
    return await prisma.message.delete({
      where: { id: messageId }
    });
  }

  /**
   * Clear conversation messages
   */
  async clearConversationMessages(conversationId: string) {
    return await prisma.message.deleteMany({
      where: { conversationId }
    });
  }

  /**
   * Get conversation summary
   */
  async generateConversationSummary(conversationId: string) {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { position: 'asc' },
      take: 100 // Limit to last 100 messages for summary
    });
    
    if (messages.length === 0) {
      return 'Empty conversation';
    }
    
    // Simple summary - count messages by sender
    const messageCounts = messages.reduce((acc, msg) => {
      acc[msg.sender] = (acc[msg.sender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const summary = `Conversation with ${messageCounts.user || 0} user messages, ${messageCounts.agent || 0} agent responses, and ${messageCounts.system || 0} system messages.`;
    
    // Update conversation with summary
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { summary }
    });
    
    return summary;
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(conversationId: string) {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      select: {
        sender: true,
        tokens: true,
        createdAt: true
      }
    });
    
    const stats = {
      totalMessages: messages.length,
      totalTokens: messages.reduce((sum, msg) => sum + (msg.tokens || 0), 0),
      messagesBySender: messages.reduce((acc, msg) => {
        acc[msg.sender] = (acc[msg.sender] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      tokensBySender: messages.reduce((acc, msg) => {
        acc[msg.sender] = (acc[msg.sender] || 0) + (msg.tokens || 0);
        return acc;
      }, {} as Record<string, number>),
      firstMessage: messages.length > 0 ? messages[0].createdAt : null,
      lastMessage: messages.length > 0 ? messages[messages.length - 1].createdAt : null
    };
    
    return stats;
  }

  /**
   * Search messages in conversation
   */
  async searchMessages(conversationId: string, query: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          conversationId,
          content: {
            contains: query
          }
        },
        skip,
        take: limit,
        orderBy: { position: 'asc' }
      }),
      prisma.message.count({
        where: {
          conversationId,
          content: {
            contains: query
          }
        }
      })
    ]);
    
    // Parse metadata
    const parsedMessages = messages.map(message => ({
      ...message,
      metadata: message.metadata ? JSON.parse(message.metadata) : null
    }));
    
    return {
      data: parsedMessages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}

export const conversationService = new ConversationService();