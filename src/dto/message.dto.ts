// Message DTOs
export interface MessageResponse {
  id: string;
  conversationId: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  metadata?: any;
  tokens?: number;
  position?: number;
  createdAt?: Date;
  memory?: any;
  llmMessage?: any;
  answerMemory?: any;
}

export interface MessageListResponse {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateMessageData {
  conversationId: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  metadata?: any;
  tokens?: number;
}
