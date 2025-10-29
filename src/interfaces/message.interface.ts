import { Message } from '@prisma/client';

/**
 * Message Model - Represents the database model structure
 */
export interface MessageModel extends Partial<Message> {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  conversationId: string;
  userId?: string | null;
  metadata?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Message DTO - Data Transfer Object for API operations
 */
export interface MessageDto {
  content: string;
  role: 'user' | 'assistant' | 'system';
  conversationId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Message DRO - Data Response Object for API responses
 */
export interface MessageDro {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  conversationId: string;
  userId?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  // Optional relations
  conversation?: any;
  user?: any;
}

/**
 * Message Create Input
 */
export interface MessageCreateInput {
  content: string;
  role: 'user' | 'assistant' | 'system';
  conversationId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Message Update Input
 */
export interface MessageUpdateInput {
  content?: string;
  role?: 'user' | 'assistant' | 'system';
  metadata?: Record<string, any>;
}

/**
 * Message Query Filters
 */
export interface MessageFilters {
  conversationId?: string;
  userId?: string;
  role?: 'user' | 'assistant' | 'system';
  createdAfter?: Date;
  createdBefore?: Date;
}
