export interface CreateToolData {
  agentId?: string;
  name: string;
  description?: string;
  type: string;
  config?: any;
  enabled?: boolean;
}

export interface UpdateToolData {
  name?: string;
  description?: string;
  type?: string;
  config?: any;
  enabled?: boolean;
}
