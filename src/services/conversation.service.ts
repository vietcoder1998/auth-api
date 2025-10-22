import { PrismaClient } from '@prisma/client';

import { MemoryService } from './memory.service';
import { llmService } from './llm.service';
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
   * Create a new prompt history for a conversation
   */
  async createPromptHistory(userId: string, conversationId: string, prompt: string) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conversation) throw new Error('Conversation not found');
    const promptHistory = await prisma.promptHistory.create({
      data: { conversationId, prompt },
    });
    return promptHistory;
  }

  /**
   * Get all prompt histories for a conversation
   */
  async getPromptHistories(userId: string, conversationId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conversation) throw new Error('Conversation not found');
    return await prisma.promptHistory.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Update a prompt history
   */
  async updatePromptHistory(userId: string, id: string, prompt: string) {
    const existing = await prisma.promptHistory.findUnique({ where: { id } });
    if (!existing) throw new Error('Prompt not found');
    return await prisma.promptHistory.update({
      where: { id },
      data: { prompt },
    });
  }

  /**
   * Delete a prompt history
   */
  async deletePromptHistory(userId: string, id: string) {
    const existing = await prisma.promptHistory.findUnique({ where: { id } });
    if (!existing) throw new Error('Prompt not found');
    await prisma.promptHistory.delete({ where: { id } });
    return { message: 'Prompt deleted' };
  }

  async getConversations(userId: string, query: any) {
    const {
      agentId,
      page = '1',
      limit = '20',
      pageSize = limit,
      search = '',
      q = search,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = query;
    const currentPage = Math.max(1, parseInt(page as string, 10));
    const currentLimit = Math.max(1, Math.min(100, parseInt(pageSize as string, 10)));
    const skip = (currentPage - 1) * currentLimit;
    const whereClause: any = { userId };
    if (agentId && typeof agentId === 'string') {
      if (agentId.includes(',')) {
        whereClause.agentId = { in: agentId.split(',').map((id: string) => id.trim()) };
      } else {
        whereClause.agentId = agentId;
      }
    }
    if (q && typeof q === 'string' && q.trim()) {
      const searchTerm = q.trim();
      whereClause.OR = [
        { title: { contains: searchTerm } },
        {
          messages: {
            some: {
              content: { contains: searchTerm },
            },
          },
        },
      ];
    }
    const orderBy: any = {};
    if (sortBy === 'title') {
      orderBy.title = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'updatedAt') {
      orderBy.updatedAt = sortOrder;
    } else {
      orderBy.updatedAt = 'desc';
    }
    const total = await prisma.conversation.count({ where: whereClause });
    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, email: true, nickname: true, status: true },
        },
        agent: {
          select: { id: true, name: true, model: true, isActive: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, content: true, sender: true, createdAt: true, tokens: true },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy,
      skip,
      take: currentLimit,
    });
    const transformedConversations = conversations.map((conv) => ({
      ...conv,
      lastMessage: conv.messages[0] || null,
      messages: undefined,
    }));
    return {
      data: transformedConversations,
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit),
    };
  }

  async createConversation(userId: string, agentId: string, title?: string) {
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId },
    });
    if (!agent) throw new Error('Agent not found or does not belong to user');
    const conversation = await prisma.conversation.create({
      data: {
        userId,
        agentId,
        title: title || 'New Conversation',
      },
      include: {
        user: {
          select: { id: true, email: true, nickname: true, status: true },
        },
        agent: {
          select: { id: true, name: true, model: true, isActive: true },
        },
        _count: {
          select: { messages: true },
        },
      },
    });
    return conversation;
  }

  async getConversation(userId: string, id: string, page: number = 1, limit: number = 50) {
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId },
      include: {
        user: {
          select: { id: true, email: true, nickname: true, status: true },
        },
        agent: {
          select: { id: true, name: true, model: true, systemPrompt: true, isActive: true },
        },
      },
    });
    if (!conversation) throw new Error('Conversation not found');
    const skip = (page - 1) * limit;
    const [messages, totalMessages] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId: id },
        orderBy: { position: 'asc' },
        skip,
        take: limit,
      }),
      prisma.message.count({ where: { conversationId: id } }),
    ]);
    return {
      ...conversation,
      messages: {
        data: messages,
        total: totalMessages,
        page,
        limit,
        totalPages: Math.ceil(totalMessages / limit),
      },
    };
  }

  async updateConversation(userId: string, id: string, updateData: any) {
    const existingConversation = await prisma.conversation.findFirst({
      where: { id, userId },
    });
    if (!existingConversation) throw new Error('Conversation not found');
    const conversation = await prisma.conversation.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, email: true, nickname: true, status: true },
        },
        agent: {
          select: { id: true, name: true, model: true, isActive: true },
        },
        _count: {
          select: { messages: true },
        },
      },
    });
    return conversation;
  }

  async deleteConversation(userId: string, id: string) {
    const existingConversation = await prisma.conversation.findFirst({
      where: { id, userId },
    });
    if (!existingConversation) throw new Error('Conversation not found');
    await prisma.conversation.delete({ where: { id } });
    return { message: 'Conversation deleted successfully' };
  }

  /**
   * Create a new conversation
   */

  /**
   * Get conversation by ID
   */
  async getConversationById(id: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, nickname: true },
        },
        agent: {
          select: { id: true, name: true, model: true, isActive: true },
        },
        messages: {
          orderBy: { position: 'asc' },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Parse message metadata
    const parsedConversation = {
      ...conversation,
      messages: conversation.messages.map((message) => ({
        ...message,
        metadata: message.metadata ? JSON.parse(message.metadata) : null,
      })),
    };

    return parsedConversation;
  }

  /**
   * Update conversation
   */

  /**
   * Delete conversation
   */

  /**
   * Get user conversations
   */
  async getUserConversations(
    userId: string,
    agentId?: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
  ) {
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
              content: { contains: search },
            },
          },
        },
      ];
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        include: {
          agent: {
            select: { id: true, name: true, model: true, isActive: true },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.conversation.count({ where }),
    ]);

    return {
      data: conversations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Add message to conversation
   */
  async addMessage(data: CreateMessageData) {
    const { conversationId, sender, content, metadata, tokens } = data;

    // Save user message (prompt)
    const messageCount = await prisma.message.count({ where: { conversationId } });
    const message = await prisma.message.create({
      data: {
        conversationId,
        sender,
        content, // This is the prompt
        metadata: metadata ? JSON.stringify(metadata) : null,
        position: messageCount,
        tokens,
      },
    });

    // Update conversation's updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Get agentId from conversation
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    const agentId = conversation?.agentId || metadata?.agentId || '';

    // Save user message as memory
    const memory = await MemoryService.create({
      agentId,
      conversationId,
      messageId: message.id,
      type: sender === 'user' ? 'short_term' : 'answer',
      content,
      metadata: metadata ? JSON.stringify(metadata) : null,
      importance: 1,
    });

    // If sender is user, call LLM and save response as agent message and memory
    let llmMessage = null;
    let answerMemory = null;
    if (sender === 'user') {
      // Use message.content as prompt for LLM
      const agent = await prisma.agent.findUnique({ where: { id: agentId } });
      const llmResponse = await llmService.generateResponse(
        [{ role: 'user', content }], // content is the prompt
        {
          model: agent?.model || 'gpt-3.5-turbo',
          systemPrompt: agent?.systemPrompt ?? undefined,
        }
      );

      try {
        // Save agent reply as message
        llmMessage = await prisma.message.create({
          data: {
            conversationId,
            sender: 'agent',
            content: llmResponse.content,
            tokens: llmResponse.tokens,
            metadata: JSON.stringify({
              model: llmResponse.model,
              processingTime: llmResponse.processingTime,
              ...llmResponse.metadata,
              relatedUserMessageId: message.id, // link to prompt
            }),
          },
        });

        // Save agent reply as memory
        answerMemory = await MemoryService.create({
          agentId,
          conversationId,
          messageId: llmMessage.id,
          type: 'answer',
          content: llmResponse.content,
          metadata: JSON.stringify({
            model: llmResponse.model,
            relatedUserMessageId: message.id,
          }),
          importance: 1,
        });
      } catch (err) {
        // If error, push an error message as answer (not linked to question)
        llmMessage = await prisma.message.create({
          data: {
            conversationId,
            sender: 'agent',
            content: `Error: ${err instanceof Error ? err.message : String(err)}`,
            tokens: 0,
            metadata: JSON.stringify({
              error: true,
              model: agent?.model || 'gpt-3.5-turbo',
              processingTime: 0,
            }),
          },
        });

        answerMemory = await MemoryService.create({
          agentId,
          conversationId,
          messageId: llmMessage.id,
          type: 'answer',
          content: `Error: ${err instanceof Error ? err.message : String(err)}`,
          metadata: JSON.stringify({
            error: true,
            model: agent?.model || 'gpt-3.5-turbo',
          }),
          importance: 1,
        });
      }
    }

    return {
      ...message,
      metadata: message.metadata ? JSON.parse(message.metadata) : null,
      memory,
      llmMessage,
      answerMemory,
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
        orderBy: { position: 'asc' },
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    // Parse metadata
    const parsedMessages = messages.map((message) => ({
      ...message,
      metadata: message.metadata ? JSON.parse(message.metadata) : null,
    }));

    return {
      data: parsedMessages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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
      data: updateData,
    });

    return {
      ...message,
      metadata: message.metadata ? JSON.parse(message.metadata) : null,
    };
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string) {
    return await prisma.message.delete({
      where: { id: messageId },
    });
  }

  /**
   * Clear conversation messages
   */
  async clearConversationMessages(conversationId: string) {
    return await prisma.message.deleteMany({
      where: { conversationId },
    });
  }

  /**
   * Get conversation summary
   */
  async generateConversationSummary(conversationId: string) {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { position: 'asc' },
      take: 100, // Limit to last 100 messages for summary
    });

    if (messages.length === 0) {
      return 'Empty conversation';
    }

    // Simple summary - count messages by sender
    const messageCounts = messages.reduce(
      (acc, msg) => {
        acc[msg.sender] = (acc[msg.sender] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const summary = `Conversation with ${messageCounts.user || 0} user messages, ${messageCounts.agent || 0} agent responses, and ${messageCounts.system || 0} system messages.`;

    // Update conversation with summary
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { summary },
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
        createdAt: true,
      },
    });

    const stats = {
      totalMessages: messages.length,
      totalTokens: messages.reduce((sum, msg) => sum + (msg.tokens || 0), 0),
      messagesBySender: messages.reduce(
        (acc, msg) => {
          acc[msg.sender] = (acc[msg.sender] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      tokensBySender: messages.reduce(
        (acc, msg) => {
          acc[msg.sender] = (acc[msg.sender] || 0) + (msg.tokens || 0);
          return acc;
        },
        {} as Record<string, number>,
      ),
      firstMessage: messages.length > 0 ? messages[0].createdAt : null,
      lastMessage: messages.length > 0 ? messages[messages.length - 1].createdAt : null,
    };

    return stats;
  }

  /**
   * Search messages in conversation
   */
  async searchMessages(
    conversationId: string,
    query: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          conversationId,
          content: {
            contains: query,
          },
        },
        skip,
        take: limit,
        orderBy: { position: 'asc' },
      }),
      prisma.message.count({
        where: {
          conversationId,
          content: {
            contains: query,
          },
        },
      }),
    ]);

    // Parse metadata
    const parsedMessages = messages.map((message) => ({
      ...message,
      metadata: message.metadata ? JSON.parse(message.metadata) : null,
    }));

    return {
      data: parsedMessages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async executeCommand(userId: string, conversationId: string, type: string, parameters: any, commandService: any) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: { agent: true },
    });
    if (!conversation) throw new Error('Conversation not found');
    const result = await commandService.processCommand({
      conversationId,
      userId,
      agentId: conversation.agentId,
      type,
      parameters,
    });
    await prisma.message.create({
      data: {
        conversationId,
        sender: 'system',
        content: `Command executed: /${type} - ${result.message}`,
        metadata: JSON.stringify({
          command: type,
          parameters,
          result: result.success,
        }),
      },
    });
    return result;
  }
}

export const conversationService = new ConversationService();
