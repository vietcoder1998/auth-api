import { MessageRepository } from '../repositories/message.repository';
import { MessageDro, MessageDto, MessageModel, MessageFilters, MessageCreateInput, MessageUpdateInput } from '../interfaces';
import { BaseService } from './base.service';

/**
 * MessageService - Business logic layer for Message operations
 * 
 * Provides message management operations including creating, updating, 
 * finding messages by conversation, user, and advanced filtering capabilities.
 * 
 * @extends BaseService<MessageModel, MessageDto, MessageDro>
 * 
 * @example
 * ```typescript
 * const messageService = new MessageService();
 * 
 * // Create a new message
 * await messageService.createMessage({
 *   content: 'Hello!',
 *   role: 'user',
 *   conversationId: 'conv-123',
 *   userId: 'user-456'
 * });
 * 
 * // Get messages for a conversation
 * const messages = await messageService.getConversationMessages('conv-123');
 * ```
 */

export class MessageService extends BaseService<MessageModel, MessageDto, MessageDro> {
  private _messageRepository: MessageRepository;

  /**
   * Creates a new MessageService instance
   * Initializes with MessageRepository for data access
   */
  constructor() {
    const messageRepository = new MessageRepository();
    super(messageRepository);
    this._messageRepository = messageRepository;
  }

  get messageRepository(): MessageRepository {
    return this._messageRepository;
  }

  /**
   * Create a new message
   * @param input - Message creation data
   * @returns Created message
   * @example
   * ```typescript
   * const message = await messageService.createMessage({
   *   content: 'Hello World',
   *   role: 'user',
   *   conversationId: 'conv-123',
   *   userId: 'user-456'
   * });
   * ```
   */
  async createMessage(input: MessageCreateInput): Promise<MessageDro> {
    const messageData: any = {
      content: input.content,
      role: input.role,
      conversationId: input.conversationId,
      userId: input.userId,
    };

    // Stringify metadata if provided
    if (input.metadata) {
      messageData.metadata = JSON.stringify(input.metadata);
    }

    const message = await this._messageRepository.create(messageData) as any;
    
    // Parse metadata back to object for response
    if (message.metadata) {
      message.metadata = JSON.parse(message.metadata as string);
    }

    return message as MessageDro;
  }

  /**
   * Update an existing message
   * @param id - Message ID
   * @param input - Message update data
   * @returns Updated message
   * @example
   * ```typescript
   * const updated = await messageService.updateMessage('msg-123', {
   *   content: 'Updated content'
   * });
   * ```
   */
  async updateMessage(id: string, input: MessageUpdateInput): Promise<MessageDro> {
    const updateData: any = {};

    if (input.content !== undefined) {
      updateData.content = input.content;
    }
    
    if (input.role !== undefined) {
      updateData.role = input.role;
    }

    if (input.metadata !== undefined) {
      updateData.metadata = JSON.stringify(input.metadata);
    }

    const message = await this._messageRepository.update(id, updateData) as any;
    
    // Parse metadata back to object for response
    if (message.metadata) {
      message.metadata = JSON.parse(message.metadata as string);
    }

    return message as MessageDro;
  }

  /**
   * Get all messages for a conversation
   * @param conversationId - The conversation ID
   * @param includeRelations - Whether to include user and conversation relations
   * @returns Array of messages
   * @example
   * ```typescript
   * const messages = await messageService.getConversationMessages('conv-123', true);
   * ```
   */
  async getConversationMessages(conversationId: string, includeRelations: boolean = false): Promise<MessageDro[]> {
    const messages = await this._messageRepository.findByConversationId(conversationId, includeRelations) as any[];
    
    return messages.map((message: any) => ({
      ...message,
      metadata: message.metadata ? JSON.parse(message.metadata as string) : null,
    }));
  }

  /**
   * Get all messages for a user
   * @param userId - The user ID
   * @param includeRelations - Whether to include conversation relation
   * @returns Array of messages
   * @example
   * ```typescript
   * const userMessages = await messageService.getUserMessages('user-456');
   * ```
   */
  async getUserMessages(userId: string, includeRelations: boolean = false): Promise<MessageDro[]> {
    const messages = await this._messageRepository.findByUserId(userId, includeRelations) as any[];
    
    return messages.map((message: any) => ({
      ...message,
      metadata: message.metadata ? JSON.parse(message.metadata as string) : null,
    }));
  }

  /**
   * Get messages by agent ID (legacy support)
   * @param agentId - The agent ID
   * @returns Array of messages
   * @example
   * ```typescript
   * const agentMessages = await messageService.getAgentMessages('agent-789');
   * ```
   */
  async getAgentMessages(agentId: string): Promise<MessageDro[]> {
    const messages = await this._messageRepository.findByAgentId(agentId) as any[];
    
    return messages.map((message: any) => ({
      ...message,
      metadata: message.metadata ? JSON.parse(message.metadata as string) : null,
    }));
  }

  /**
   * Find messages with advanced filters
   * @param filters - Filter criteria
   * @param includeRelations - Whether to include relations
   * @returns Array of filtered messages
   * @example
   * ```typescript
   * const filtered = await messageService.findMessagesWithFilters({
   *   role: 'assistant',
   *   createdAfter: new Date('2023-01-01')
   * });
   * ```
   */
  async findMessagesWithFilters(filters: MessageFilters, includeRelations: boolean = false): Promise<MessageDro[]> {
    const messages = await this._messageRepository.findWithFilters(filters, includeRelations) as any[];
    
    return messages.map((message: any) => ({
      ...message,
      metadata: message.metadata ? JSON.parse(message.metadata as string) : null,
    }));
  }

  /**
   * Get paginated messages for a conversation
   * @param conversationId - The conversation ID
   * @param page - Page number (1-based)
   * @param limit - Number of messages per page
   * @returns Paginated messages with metadata
   * @example
   * ```typescript
   * const result = await messageService.getPaginatedConversationMessages('conv-123', 1, 20);
   * console.log(`Page 1 of ${result.totalPages}: ${result.messages.length} messages`);
   * ```
   */
  async getPaginatedConversationMessages(conversationId: string, page: number = 1, limit: number = 50) {
    const result = await this._messageRepository.getPaginatedMessages(conversationId, page, limit);
    
    return {
      ...result,
      messages: result.messages.map((message: any) => ({
        ...message,
        metadata: message.metadata ? JSON.parse(message.metadata as string) : null,
      })),
    };
  }

  /**
   * Get message count for a conversation
   * @param conversationId - The conversation ID
   * @returns Message count
   * @example
   * ```typescript
   * const count = await messageService.getConversationMessageCount('conv-123');
   * ```
   */
  async getConversationMessageCount(conversationId: string): Promise<number> {
    return this._messageRepository.countByConversationId(conversationId);
  }

  /**
   * Get the latest message in a conversation
   * @param conversationId - The conversation ID
   * @returns Latest message or null
   * @example
   * ```typescript
   * const latest = await messageService.getLatestConversationMessage('conv-123');
   * ```
   */
  async getLatestConversationMessage(conversationId: string): Promise<MessageDro | null> {
    const message = await this._messageRepository.getLatestMessageInConversation(conversationId);
    
    if (!message) return null;
    
    return {
      ...message,
      metadata: message.metadata ? JSON.parse(message.metadata as string) : null,
    };
  }

  /**
   * Search messages by content
   * @param searchText - Text to search for
   * @param conversationId - Optional conversation ID to limit search
   * @returns Array of matching messages
   * @example
   * ```typescript
   * const results = await messageService.searchMessages('hello world', 'conv-123');
   * ```
   */
  async searchMessages(searchText: string, conversationId?: string): Promise<MessageDro[]> {
    const messages = await this._messageRepository.searchMessages(searchText, conversationId) as any[];
    
    return messages.map((message: any) => ({
      ...message,
      metadata: message.metadata ? JSON.parse(message.metadata as string) : null,
    }));
  }

  /**
   * Update message metadata
   * @param id - Message ID
   * @param metadata - Metadata to update
   * @returns Updated message
   * @example
   * ```typescript
   * const updated = await messageService.updateMessageMetadata('msg-123', {
   *   edited: true,
   *   editedAt: new Date()
   * });
   * ```
   */
  async updateMessageMetadata(id: string, metadata: Record<string, any>): Promise<MessageDro> {
    const message = await this._messageRepository.updateMetadata(id, metadata);
    
    return {
      ...message,
      metadata: message.metadata ? JSON.parse(message.metadata as string) : null,
    };
  }

  /**
   * Delete all messages in a conversation
   * @param conversationId - The conversation ID
   * @returns Delete result with count
   * @example
   * ```typescript
   * const result = await messageService.deleteConversationMessages('conv-123');
   * console.log(`Deleted ${result.count} messages`);
   * ```
   */
  async deleteConversationMessages(conversationId: string): Promise<{ count: number }> {
    return this._messageRepository.deleteByConversationId(conversationId);
  }

  /**
   * Delete all messages by a user
   * @param userId - The user ID
   * @returns Delete result with count
   * @example
   * ```typescript
   * const result = await messageService.deleteUserMessages('user-456');
   * console.log(`Deleted ${result.count} messages`);
   * ```
   */
  async deleteUserMessages(userId: string): Promise<{ count: number }> {
    return this._messageRepository.deleteByUserId(userId);
  }

  /**
   * Create multiple messages in a conversation (batch operation)
   * @param messages - Array of message creation data
   * @returns Array of created messages
   * @example
   * ```typescript
   * const messages = await messageService.createBatchMessages([
   *   { content: 'Hello', role: 'user', conversationId: 'conv-123' },
   *   { content: 'Hi there!', role: 'assistant', conversationId: 'conv-123' }
   * ]);
   * ```
   */
  async createBatchMessages(messages: MessageCreateInput[]): Promise<MessageDro[]> {
    const createData = messages.map(msg => ({
      content: msg.content,
      role: msg.role,
      conversationId: msg.conversationId,
      userId: msg.userId,
      metadata: msg.metadata ? JSON.stringify(msg.metadata) : undefined,
    }));

    const created = await this._messageRepository.createMany(createData) as any[];
    
    return created.map((message: any) => ({
      ...message,
      metadata: message.metadata ? JSON.parse(message.metadata) : null,
    }));
  }
}

export const messageService = new MessageService();