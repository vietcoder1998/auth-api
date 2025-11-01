import { PrismaClient } from '@prisma/client';

/**
 * Message Model - Represents the database model structure
 */
export type MessageModel = PrismaClient['message'];
export interface Message extends Partial<MessageModel> {
  id: string;
  content: string;
  /** canonical sender field used in the codebase */
  sender: 'user' | 'agent' | 'system';
  /** legacy alias kept for compatibility */
  role?: 'user' | 'assistant' | 'system';
  conversationId: string;
  userId?: string | null;
  metadata?: string | null;
  createdAt: Date;
  updatedAt: Date;
  tokens?: number;
}

/**
 * Message DTO - Data Transfer Object for API operations
 */
export interface MessageDto {
  id?: string;
  content: string;
  conversationId: string;
  sender?: 'user' | 'agent' | 'system';
  role?: 'user' | 'assistant' | 'system';
  userId?: string | null;
  metadata?: Record<string, any> | null;
  tokens?: number;
  position?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Message DRO - Data Response Object for API responses
 */
export interface MessageDro extends Partial<MessageDto> {
  id: string;
  content: string;
  sender: 'user' | 'agent' | 'system';
  conversationId: string;
  userId?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: Date;
  // Optional relations
  conversation?: any;
  user?: any;
}

/**
 * Message Create Input
 */
export interface MessageCreateInput {
  content: string;
  sender?: 'user' | 'agent' | 'system';
  role?: 'user' | 'assistant' | 'system';
  conversationId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Message Update Input
 */
export interface MessageUpdateInput {
  content?: string;
  sender?: 'user' | 'agent' | 'system';
  role?: 'user' | 'assistant' | 'system';
  metadata?: Record<string, any>;
}

/**
 * Message Query Filters
 */
export interface MessageFilters {
  conversationId?: string;
  userId?: string;
  sender?: 'user' | 'agent' | 'system';
  createdAfter?: Date;
  createdBefore?: Date;
}
