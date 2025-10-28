export interface AgentDto {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  model?: string | null;
  aiModelId?: string | null;
  personality?: string | null;
  systemPrompt?: string | null;
  config?: any;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateAgentData {
  userId: string;
  name: string;
  description?: string;
  model?: string;
  aiModelId?: string;
  personality?: string;
  systemPrompt?: string;
  config?: any;
}

export interface UpdateAgentData {
  name?: string;
  description?: string;
  model?: string;
  aiModelId?: string;
  personality?: string;
  systemPrompt?: string;
  config?: any;
  isActive?: boolean;
}

export interface AgentMemoryDto {
  id: string;
  agentId: string;
  type: string;
  content: string;
  metadata?: any;
  importance?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateAgentMemoryData {
  agentId: string;
  type: string;
  content: string;
  metadata?: any;
  importance?: number;
}

export interface AgentListResponse {
  data: AgentDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AgentMemoryListResponse {
  data: AgentMemoryDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}