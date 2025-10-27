// Conversation DTOs
export interface ConversationPromptHistory {
  id: string;
  conversationId: string;
  prompt: string;
  createdAt: Date;
}

export interface ConversationPromptHistoryList {
  data: ConversationPromptHistory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ConversationListItem {
  id: string;
  userId: string;
  agentId: string;
  title: string | null;
  summary?: string | null;
  isActive?: boolean | null;
  lastMessage?: any;
  _count?: { messages: number };
  agent?: any;
  user?: any;
}

export interface ConversationListResponse {
  data: ConversationListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ConversationDetail {
  id: string;
  userId: string;
  agentId: string;
  title: string | null;
  summary?: string | null;
  isActive?: boolean | null;
  user?: any;
  agent?: any;
  messages: {
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ConversationStats {
  totalMessages: number;
  totalTokens: number;
  messagesBySender: Record<string, number>;
  tokensBySender: Record<string, number>;
  firstMessage: Date | null;
  lastMessage: Date | null;
}

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

export interface DeleteResponse {
  message: string;
}
