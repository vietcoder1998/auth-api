import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateAgentData {
  userId: string;
  name: string;
  description?: string;
  model?: string;
  aiModelId?: string;
  personality?: any;
  systemPrompt?: string;
  config?: any;
}

export interface UpdateAgentData {
  name?: string;
  description?: string;
  model?: string;
  aiModelId?: string;
  personality?: any;
  systemPrompt?: string;
  config?: any;
  isActive?: boolean;
}

export class AgentService {
  /**
   * Create a new agent
   */
  async createAgent(data: CreateAgentData) {
    const { userId, name, description, model, aiModelId, personality, systemPrompt, config } = data;

    const agent = await prisma.agent.create({
      data: {
        userId,
        name,
        description,
        aIModelId: aiModelId,
        personality: personality ? JSON.stringify(personality) : null,
        systemPrompt,
        config: config
          ? JSON.stringify(config)
          : JSON.stringify({
              temperature: 0.7,
              maxTokens: 1000,
            }),
      },
      include: {
        user: {
          select: { id: true, email: true, nickname: true },
        },
        model: true,
        _count: {
          select: {
            conversations: true,
            memories: true,
            tools: true,
            tasks: true,
          },
        },
      },
    });

    // Parse JSON fields and always include model
    return {
      ...agent,
      personality: agent.personality ? JSON.parse(agent.personality) : null,
      config: agent.config ? JSON.parse(agent.config) : null,
      model: agent.model || null,
    };
  }

  /**
   * Get agent by ID
   */
  async getAgentById(id: string) {
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, nickname: true },
        },
        model: true,
        memories: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        tools: true,
        _count: {
          select: {
            conversations: true,
            memories: true,
            tools: true,
            tasks: true,
          },
        },
      },
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    // Parse JSON fields
    const parsedAgent = {
      ...agent,
      personality: agent.personality ? JSON.parse(agent.personality) : null,
      config: agent.config ? JSON.parse(agent.config) : null,
      model: agent.model || null,
    };

    return parsedAgent;
  }

  /**
   * Update agent
   */
  async updateAgent(id: string, data: UpdateAgentData) {
    const updateData: any = { ...data };

    if (data.personality) {
      updateData.personality = JSON.stringify(data.personality);
    }

    if (data.config) {
      updateData.config = JSON.stringify(data.config);
    }

    if (data.aiModelId) {
      updateData.model = { connect: { id: data.aiModelId } };
      delete updateData.aiModelId;
    }

    const agent = await prisma.agent.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, email: true, nickname: true },
        },
        model: true,
        _count: {
          select: {
            conversations: true,
            memories: true,
            tools: true,
            tasks: true,
          },
        },
      },
    });

    // Parse JSON fields
    const parsedAgent = {
      ...agent,
      personality: agent.personality ? JSON.parse(agent.personality) : null,
      config: agent.config ? JSON.parse(agent.config) : null,
      model: agent.model || null,
    };

    return parsedAgent;
  }

  /**
   * Delete agent
   */
  async deleteAgent(id: string) {
    return await prisma.agent.delete({
      where: { id },
    });
  }

  /**
   * Get agents for user
   */
  async getUserAgents(userId: string, page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;

    // Build search filter
    const where: any = { userId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        skip,
        take: limit,
        include: {
          model: true,
          _count: {
            select: {
              conversations: true,
              memories: true,
              tools: true,
              tasks: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.agent.count({ where }),
    ]);

    // Parse JSON fields
    const parsedAgents = agents.map((agent) => ({
      ...agent,
      personality: agent.personality ? JSON.parse(agent.personality) : null,
      config: agent.config ? JSON.parse(agent.config) : null,
      model: agent.model || null,
    }));

    return {
      data: parsedAgents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Add memory to agent
   */
  async addMemory(
    agentId: string,
    content: string,
    type: string = 'long_term',
    importance: number = 5,
    metadata?: any,
  ) {
    return await prisma.agentMemory.create({
      data: {
        agentId,
        content,
        type,
        importance,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  }

  /**
   * Get agent memories
   */
  async getAgentMemories(agentId: string, type?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const where: any = { agentId };
    if (type) {
      where.type = type;
    }

    const [memories, total] = await Promise.all([
      prisma.agentMemory.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ importance: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.agentMemory.count({ where }),
    ]);

    // Parse metadata
    const parsedMemories = memories.map((memory) => ({
      ...memory,
      metadata: memory.metadata ? JSON.parse(memory.metadata) : null,
    }));

    return {
      data: parsedMemories,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Search agent memories
   */
  async searchMemories(agentId: string, query: string, limit: number = 10) {
    const memories = await prisma.agentMemory.findMany({
      where: {
        agentId,
        content: {
          contains: query,
        },
      },
      orderBy: { importance: 'desc' },
      take: limit,
    });

    return memories.map((memory) => ({
      ...memory,
      metadata: memory.metadata ? JSON.parse(memory.metadata) : null,
    }));
  }

  /**
   * Add tool to agent (create Tool with agentId)
   */
  async addTool(agentId: string, name: string, type: string, config?: any) {
    return await prisma.tool.create({
      data: {
        agentId,
        name,
        type,
        config: config ? JSON.stringify(config) : null,
        enabled: true,
      },
    });
  }

  /**
   * Get agent tools (all tools with agentId)
   */
  async getAgentTools(agentId: string) {
    const tools = await prisma.tool.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
    });
    return tools.map((tool) => ({
      ...tool,
      config: tool.config ? JSON.parse(tool.config) : null,
    }));
  }

  /**
   * Update tool by id
   */
  async updateTool(toolId: string, config?: any, enabled?: boolean) {
    const updateData: any = {};
    if (config !== undefined) {
      updateData.config = JSON.stringify(config);
    }
    if (enabled !== undefined) {
      updateData.enabled = enabled;
    }
    return await prisma.tool.update({
      where: { id: toolId },
      data: updateData,
    });
  }

  /**
   * Create task for agent
   */
  async createTask(agentId: string, name: string, input?: any) {
    return await prisma.agentTask.create({
      data: {
        agentId,
        name,
        input: input ? JSON.stringify(input) : null,
      },
    });
  }

  /**
   * Get agent tasks
   */
  async getAgentTasks(agentId: string, status?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const where: any = { agentId };
    if (status) {
      where.status = status;
    }

    const [tasks, total] = await Promise.all([
      prisma.agentTask.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.agentTask.count({ where }),
    ]);

    // Parse JSON fields
    const parsedTasks = tasks.map((task) => ({
      ...task,
      input: task.input ? JSON.parse(task.input) : null,
      output: task.output ? JSON.parse(task.output) : null,
    }));

    return {
      data: parsedTasks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: string, output?: any, error?: string) {
    const updateData: any = { status };

    if (output) {
      updateData.output = JSON.stringify(output);
    }

    if (error) {
      updateData.error = error;
    }

    if (status === 'running' && !updateData.startedAt) {
      updateData.startedAt = new Date();
    }

    const task = await prisma.agentTask.update({
      where: { id: taskId },
      data: updateData,
    });

    return {
      ...task,
      input: task.input ? JSON.parse(task.input) : null,
      output: task.output ? JSON.parse(task.output) : null,
    };
  }

  /**
   * Update all Conversations for an Agent to use a selected AIKey and platform
   */
  async updateAgentConversationsKeyPlatform(agentId: string, aiKeyId: string, platformId: string) {
    // Bulk update all conversations for this agent
    return await prisma.conversation.updateMany({
      where: { agentId },
      data: {
        aiKeyId,
        platformId,
      },
    });
  }
}

export const agentService = new AgentService();
