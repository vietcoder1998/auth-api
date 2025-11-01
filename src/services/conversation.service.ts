import {
  ConversationDetail,
  ConversationListItem,
  ConversationListResponse,
  ConversationPromptHistory,
  ConversationStats,
  DeleteResponse,
} from '../dto/conversation.dto';
import { CreateMessageData, MessageListResponse, MessageResponse } from '../dto/message.dto';
import { ConversationDro, ConversationDto, ConversationModel, MessageDto } from '../interfaces';
import { cacheMiddleware } from '../middlewares/cache.middleware';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';
import { PromptHistoryRepository } from '../repositories/prompthistory.repository';
import { prisma } from '../setup';
import { BaseService } from './base.service';
import { llmService } from './llm.service';
import { MemoryService } from './memory.service';

export class ConversationService extends BaseService<
  ConversationModel,
  ConversationDto,
  ConversationDro
> {
  private conversationRepository: ConversationRepository;
  private messageRepository: MessageRepository;
  private memoryService: MemoryService;
  private promptHistoryRepository: PromptHistoryRepository;

  constructor() {
    const conversationRepository = new ConversationRepository();
    super(conversationRepository);
    this.conversationRepository = conversationRepository;
    this.messageRepository = new MessageRepository();
    this.memoryService = new MemoryService();
    this.promptHistoryRepository = new PromptHistoryRepository();
  }
  /**
   * Create a new prompt history for a conversation
   */
  async createPromptHistory(
    userId: string,
    conversationId: string,
    prompt: string,
  ): Promise<ConversationPromptHistory> {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conversation) throw new Error('Conversation not found');
    const promptHistory = await this.promptHistoryRepository.create({
      conversationId,
      prompt,
    });
    // Invalidate cache for conversations after prompt
    await cacheMiddleware.invalidateCacheByUrlPattern('/api/admin/conversations');
    return promptHistory;
  }

  /**
   * Get all prompt histories for a conversation
   */
  async getPromptHistories(
    userId: string,
    conversationId: string,
  ): Promise<ConversationPromptHistory[]> {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conversation) throw new Error('Conversation not found');
    return await this.promptHistoryRepository.findMany({
      conversationId,
    });
  }

  /**
   * Update a prompt history
   */
  async updatePromptHistory(
    userId: string,
    id: string,
    prompt: string,
  ): Promise<ConversationPromptHistory> {
    const existing = await this.promptHistoryRepository.findById(id);
    if (!existing) throw new Error('Prompt not found');
    return await this.promptHistoryRepository.update(id, { prompt });
  }

  /**
   * Delete a prompt history
   */
  async deletePromptHistory(userId: string, id: string): Promise<DeleteResponse> {
    const existing = await this.promptHistoryRepository.findById(id);
    if (!existing) throw new Error('Prompt not found');
    await this.promptHistoryRepository.delete(id);
    return { message: 'Prompt deleted' };
  }

  async getConversations(userId: string, query: any): Promise<ConversationListResponse> {
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

    console.log(query)
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
    switch (sortBy) {
      case 'title':
        orderBy.title = sortOrder;
        break;
      case 'createdAt':
        orderBy.createdAt = sortOrder;
        break;
      case 'updatedAt':
        orderBy.updatedAt = sortOrder;
        break;
      default:
        orderBy.updatedAt = 'desc';
        break;
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
    const transformedConversations = conversations.map((conversation) => ({
      ...conversation,
      title: conversation.title ?? '',
      summary: conversation.summary ?? '',
      isActive: conversation.isActive ?? null,
      lastMessage: conversation.messages[0] || null,
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
  async createConversation(
    userId: string,
    agentId: string,
    title?: string,
  ): Promise<ConversationListItem> {
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
    return {
      ...conversation,
      title: conversation.title ?? '',
      summary: conversation.summary ?? '',
      isActive: conversation.isActive ?? null,
    };
  }

  async getConversation(
    userId: string,
    id: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<ConversationDetail> {
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
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.message.count({ where: { conversationId: id } }),
    ]);
    return {
      ...conversation,
      title: conversation.title ?? '',
      summary: conversation.summary ?? '',
      isActive: conversation.isActive ?? null,
      messages: {
        data: messages,
        total: totalMessages,
        page,
        limit,
        totalPages: Math.ceil(totalMessages / limit),
      },
    };
  }

  async updateConversation(
    userId: string,
    id: string,
    updateData: any,
  ): Promise<ConversationListItem> {
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
    return {
      ...conversation,
      title: conversation.title ?? '',
      summary: conversation.summary ?? '',
      isActive: conversation.isActive ?? null,
    };
  }

  async deleteConversation(userId: string, id: string): Promise<DeleteResponse> {
    const existingConversation = await prisma.conversation.findFirst({
      where: { id, userId },
    });
    if (!existingConversation) throw new Error('Conversation not found');
    await prisma.conversation.delete({ where: { id } });
    return { message: 'Conversation deleted successfully' };
  }

  async getConversationById(id: string): Promise<ConversationDetail> {
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
          orderBy: { createdAt: 'asc' },
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

    // Ensure messages property matches ConversationDetail interface
    return {
      ...parsedConversation,
      title: parsedConversation.title ?? '',
      summary: parsedConversation.summary ?? '',
      isActive: parsedConversation.isActive ?? null,
      messages: {
        data: Array.isArray(parsedConversation.messages)
          ? parsedConversation.messages.map((msg) => ({
              ...msg,
              tokens: msg.tokens ?? -1,
            }))
          : [],
        total: Array.isArray(parsedConversation.messages) ? parsedConversation.messages.length : 0,
        page: 1,
        limit: parsedConversation.messages?.length ?? 0,
        totalPages: 1,
      },
    };
  }

  async getUserConversations(
    userId: string,
    agentId?: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
  ): Promise<ConversationListResponse> {
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

    const transformedConversations = conversations.map((conversation) => ({
      ...conversation,
      title: conversation.title ?? '',
      summary: conversation.summary ?? '',
      isActive: conversation.isActive ?? null,
    }));
    return {
      data: transformedConversations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async addMessage(data: CreateMessageData): Promise<MessageResponse> {
    const { conversationId, sender, content, metadata, tokens } = data;

    // Save user message (prompt)
    const messageCount = await this.messageRepository.count({ conversationId });
    const message = await this.messageRepository.create({
      conversationId,
      sender,
      content, // This is the prompt
      metadata: metadata ? JSON.stringify(metadata) : null,
      position: messageCount,
      tokens,
    });

    // Update conversation timestamp and connect message
    const conversation: ConversationDro = await this.conversationRepository.update(conversationId, {
      updatedAt: new Date(),
    });

    // Also add a promptHistory for this message
    await this.promptHistoryRepository.create({
      conversationId,
      prompt: content,
    });

    // Invalidate cache for conversations after message
    await cacheMiddleware.invalidateCacheByUrlPattern('/api/admin/conversations');


    const agentId = conversation?.agentId || metadata?.agentId || '';

    // Save user message as memory
    const memory = await this.memoryService.create({
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

    const llmResponse = await llmService.processAndSaveConversation(
      conversationId,
      content,
      agentId,
    );

    // Save agent reply as message
    llmMessage = await this.messageRepository.create({
      agentId,
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
    });

    return {
      id: message.id,
      conversationId: message.conversationId,
      sender: (['user', 'agent', 'system'].includes(message.sender) ? message.sender : 'user') as
        | 'user'
        | 'agent'
        | 'system',
      content: message.content,
      metadata: message.metadata ? JSON.parse(message.metadata) : null,
      tokens: message.tokens ?? -1,
      position: message.position,
      createdAt: message.createdAt,
      memory,
      llmMessage,
      answerMemory,
    };
  }

  async getConversationMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<MessageListResponse> {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.messageRepository.search({
        where: { conversationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      this.messageRepository.count({ conversationId }),
    ]);

    // Parse metadata
    const parsedMessages = messages.map((message: any) => ({
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

  async updateMessage(
    messageId: string,
    content: string,
    metadata?: any,
  ): Promise<MessageResponse> {
    const updateData: any = { content };

    if (metadata) {
      updateData.metadata = JSON.stringify(metadata);
    }

    const message: MessageDto = await this.messageRepository.update(messageId, updateData);

    const sender =
      message && (['user', 'agent', 'system'] as const).includes(message.sender as any)
        ? (message.sender as 'user' | 'agent' | 'system')
        : 'user';

    // Parse metadata which may be stored as JSON string or already as object
    let parsedMetadata: any = null;
    if (typeof message.metadata === 'string') {
      parsedMetadata = JSON.parse(message.metadata);
    } else {
      parsedMetadata = message.metadata ?? null;
    }

    const response: MessageResponse = {
      id: message.id ?? messageId,
      conversationId: message.conversationId,
      sender,
      content: message.content,
      metadata: parsedMetadata,
      tokens: message.tokens ?? -1,
      createdAt: message.createdAt,
      memory: (message as any).memory,
      llmMessage: (message as any).llmMessage,
      answerMemory: (message as any).answerMemory,
    };

    return response;
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string): Promise<any> {
    return await this.messageRepository.delete(messageId);
  }

  /**
   * Clear conversation messages
   */
  async clearConversationMessages(conversationId: string): Promise<any> {
    // Use repository's search to find all messages first, then delete them
    const messages = await this.messageRepository.search({
      where: { conversationId },
    });

    // Delete each message using repository
    await Promise.all(messages.map((message: any) => this.messageRepository.delete(message.id)));

    return { deleted: messages.length };
  }

  /**
   * Get conversation summary
   */
  async generateConversationSummary(conversationId: string): Promise<string> {
    const messages: MessageDto[] | null = await this.messageRepository.search({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 100, // Limit to last 100 messages for summary
    });

    const msgs = messages || [];
    if (msgs.length === 0) return 'Empty conversation';

    // Simple summary - count messages by sender
    const messageCounts = msgs.reduce(
      (acc: Record<string, number>, msg: MessageDto) => {
        const key = (msg.sender as string) || (msg as any).role || 'user';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const summary = `Conversation with ${messageCounts['user'] || 0} user messages, ${messageCounts['agent'] || 0} agent responses, and ${messageCounts['system'] || 0} system messages.`;

    // Update conversation with summary
    await this.conversationRepository.update(conversationId, { summary });

    return summary;
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(conversationId: string): Promise<ConversationStats> {
    const messages: MessageDto[] | null = await this.messageRepository.search({
      where: { conversationId },
      select: {
        sender: true,
        tokens: true,
        createdAt: true,
      },
    });
    const msgs2 = messages || [];
    const stats = {
      totalMessages: msgs2.length,
      totalTokens: msgs2.reduce((sum: number, msg: MessageDto) => sum + (msg.tokens || 0), 0),
      messagesBySender: msgs2.reduce(
        (acc: Record<string, number>, msg: MessageDto) => {
          const key = (msg.sender as string) || (msg as any).role || 'user';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      tokensBySender: msgs2.reduce(
        (acc: Record<string, number>, msg: MessageDto) => {
          const key = (msg.sender as string) || (msg as any).role || 'user';
          acc[key] = (acc[key] || 0) + (msg.tokens || 0);
          return acc;
        },
        {} as Record<string, number>,
      ),
      firstMessage: msgs2.length > 0 ? (msgs2[0].createdAt ?? null) : null,
      lastMessage: msgs2.length > 0 ? (msgs2[msgs2.length - 1].createdAt ?? null) : null,
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
  ): Promise<MessageListResponse> {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.messageRepository.search({
        where: {
          conversationId,
          content: {
            contains: query,
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      this.messageRepository.count({
        conversationId,
        content: {
          contains: query,
        },
      }),
    ]);

    // Parse metadata
    const parsedMessages = messages.map((message: any) => ({
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

  async executeCommand(
    userId: string,
    conversationId: string,
    type: string,
    parameters: any,
    commandService: any,
  ): Promise<any> {
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
    const message = await prisma.message.create({
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

    if (!message) throw new Error('Message not found');

    return result;
  }
}

export const conversationService = new ConversationService();
