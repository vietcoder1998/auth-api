import { PrismaClient } from '@prisma/client';
import { AgentRepository, AgentMemoryRepository, AgentTaskRepository, ToolRepository } from '../../src/repositories';

/**
 * AgentsSeeder - Handles all agent-related seeding operations
 * 
 * This includes:
 * - AI Agents
 * - Agent Memories
 * - Agent Tasks
 * - Agent Tools
 */
export class AgentsSeeder {
  private prisma: PrismaClient;
  private agentRepo: AgentRepository;
  private agentMemoryRepo: AgentMemoryRepository;
  private agentTaskRepo: AgentTaskRepository;
  private toolRepo: ToolRepository;
  
  private mockLabelId?: string;
  private userMapping: Record<string, any>;
  private createdAgents: any[] = [];

  constructor(
    prisma: PrismaClient,
    userMapping: Record<string, any>,
    mockLabelId?: string
  ) {
    this.prisma = prisma;
    this.userMapping = userMapping;
    this.mockLabelId = mockLabelId;
    
    this.agentRepo = new AgentRepository();
    this.agentMemoryRepo = new AgentMemoryRepository();
    this.agentTaskRepo = new AgentTaskRepository();
    this.toolRepo = new ToolRepository();
  }

  /**
   * Seed all agent-related data
   */
  async seed(): Promise<void> {
    await this.seedAgents();
    await this.seedAgentMemories();
    await this.seedAgentTools();
    await this.seedAgentTasks();
  }

  /**
   * Seed AI Agents
   */
  async seedAgents(): Promise<void> {
    console.log('🤖 Seeding AI Agents...');
    const { mockAgents } = await import('../mock/agents.mock');
    
    const superadminUser = this.userMapping['superadmin@example.com'];
    const adminUser = this.userMapping['admin@example.com'];
    const regularUser = this.userMapping['user@example.com'];
    
    const agentUserMapping: Record<string, string> = {
      'super-admin-id': superadminUser?.id || '',
      'admin-id': adminUser?.id || '',
      'user-id': regularUser?.id || '',
    };

    // Prepare agent data with model connections
    const aiAgents: any[] = [];
    for (const agent of mockAgents) {
      let modelConnect: any = undefined;
      if (agent.model) {
        const model = await this.prisma.aIModel.findUnique({
          where: { name: agent.model }
        });
        if (model) modelConnect = { connect: { id: model.id } };
      }
      
      const { model, ownerId, id, ...agentData } = agent;
      aiAgents.push({
        ...agentData,
        user: { connect: { id: agentUserMapping[ownerId] || '' } },
        ...(modelConnect ? { model: modelConnect } : {}),
      });
    }

    // Create or find agents
    for (const agent of aiAgents) {
      if (agent.user && agent.user.connect && agent.user.connect.id) {
        try {
          const existingAgent = await this.prisma.agent.findFirst({
            where: { userId: agent.user.connect.id, name: agent.name },
            include: {
              user: {
                select: { id: true, email: true, nickname: true, status: true },
              },
            },
          });

          if (!existingAgent) {
            const createdAgent = await this.prisma.agent.create({ data: agent });
            this.createdAgents.push(createdAgent);
            console.log(`  ✓ Created: ${agent.name} (Active: ${agent.isActive})`);
          } else {
            this.createdAgents.push(existingAgent);
            console.log(`  ⚠ Exists: ${agent.name} (Owner: ${existingAgent.user?.nickname})`);
          }
        } catch (error) {
          console.log(`  ❌ Error creating ${agent.name}:`, error);
        }
      }
    }

    // Add labels
    if (this.mockLabelId && this.createdAgents.length > 0) {
      const agentLabels = this.createdAgents.map((agent) => ({
        entityId: agent.id,
        entityType: 'agent',
        labelId: this.mockLabelId!,
      }));

      await this.prisma.entityLabel.createMany({
        data: agentLabels,
        skipDuplicates: true,
      });
    }
    
    console.log(`✓ Seeded ${this.createdAgents.length} agents\n`);
  }

  /**
   * Seed Agent Memories
   */
  async seedAgentMemories(): Promise<void> {
    console.log('🧠 Seeding Agent Memories...');
    const { mockAgentMemories, mockAgents } = await import('../mock/agents.mock');
    
    const agentMemories = mockAgentMemories.map((memory) => ({
      ...memory,
      agentId: this.createdAgents.find(
        (agent) => agent.name === mockAgents.find((a) => a.id === memory.agentId)?.name
      )?.id || '',
    }));

    // Batch check for existing memories
    const memoryChecks = await Promise.all(
      agentMemories
        .filter(m => m.agentId)
        .map(async (memory) => {
          const existingMemory = await this.prisma.agentMemory.findFirst({
            where: { agentId: memory.agentId, content: memory.content },
          });
          return { memory, exists: !!existingMemory };
        })
    );

    // Batch create new memories
    const newMemories = memoryChecks.filter(check => !check.exists);
    if (newMemories.length > 0) {
      await this.prisma.agentMemory.createMany({
        data: newMemories.map(check => check.memory),
        skipDuplicates: true,
      });
      
      console.log(`  ✓ Created ${newMemories.length} new memories`);
    }
    
    console.log(`✓ Agent memories seeded\n`);
  }

  /**
   * Seed Agent Tools
   */
  async seedAgentTools(): Promise<void> {
    console.log('🛠️ Seeding Agent Tools...');
    const { mockAgentTools, mockAgents } = await import('../mock/agents.mock');
    
    const agentTools = mockAgentTools.map((tool) => ({
      ...tool,
      agentId: this.createdAgents.find(
        (agent) => agent.name === mockAgents.find((a) => a.id === tool.agentId)?.name
      )?.id || '',
    }));

    const createdAgentTools: any[] = [];
    for (const tool of agentTools) {
      if (tool.agentId) {
        try {
          const existingTool = await this.prisma.tool.findFirst({
            where: { agentId: tool.agentId, name: tool.name },
          });

          if (!existingTool) {
            const createdTool = await this.prisma.tool.create({ data: tool });
            createdAgentTools.push(createdTool);
            console.log(`  ✓ Created: ${tool.name} for agent ${tool.agentId}`);
          } else {
            createdAgentTools.push(existingTool);
          }
        } catch (error) {
          console.log(`  ❌ Error creating tool:`, error);
        }
      }
    }

    // Add labels
    if (this.mockLabelId && createdAgentTools.length > 0) {
      const agentToolLabels = createdAgentTools.map((tool) => ({
        entityId: tool.id,
        entityType: 'tool',
        labelId: this.mockLabelId!,
      }));

      await this.prisma.entityLabel.createMany({
        data: agentToolLabels,
        skipDuplicates: true,
      });
    }
    
    console.log(`✓ Seeded ${createdAgentTools.length} agent tools\n`);
  }

  /**
   * Seed Agent Tasks
   */
  async seedAgentTasks(): Promise<void> {
    console.log('📋 Seeding Agent Tasks...');
    const { mockAgentTasks, mockAgents } = await import('../mock/agents.mock');
    
    const agentTasks = mockAgentTasks.map((task: any) => ({
      ...task,
      agentId: this.createdAgents.find(
        (agent: any) => agent.name === mockAgents.find((a: any) => a.id === task.agentId)?.name
      )?.id || '',
    }));

    const createdAgentTasks: any[] = [];
    for (const task of agentTasks) {
      if (task.agentId) {
        try {
          const existingTask = await this.prisma.agentTask.findFirst({
            where: { agentId: task.agentId, name: task.name },
          });

          if (!existingTask) {
            const createdTask = await this.prisma.agentTask.create({
              data: task,
              include: {
                agent: {
                  select: {
                    name: true,
                    user: { select: { nickname: true } },
                  },
                },
              },
            });
            createdAgentTasks.push(createdTask);
            console.log(`  ✓ Created: "${task.name}" (Status: ${task.status})`);
          } else {
            createdAgentTasks.push(existingTask);
          }
        } catch (error) {
          console.log(`  ❌ Error creating task:`, error);
        }
      }
    }

    // Add labels
    if (this.mockLabelId && createdAgentTasks.length > 0) {
      const agentTaskLabels = createdAgentTasks.map((task) => ({
        entityId: task.id,
        entityType: 'agentTask',
        labelId: this.mockLabelId!,
      }));

      await this.prisma.entityLabel.createMany({
        data: agentTaskLabels,
        skipDuplicates: true,
      });
    }
    
    console.log(`✓ Seeded ${createdAgentTasks.length} agent tasks\n`);
  }

  /**
   * Get created agents for use by other seeders
   */
  getCreatedAgents(): any[] {
    return this.createdAgents;
  }
}
