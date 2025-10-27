/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import { mockAgentMemories, mockAgents, mockAgentTasks, mockAgentTools } from '../src/mock/agents';
import { mockAIKeys } from '../src/mock/aiKey';
import { mockAIPlatforms } from '../src/mock/aiPlatform';
import { mockBillings } from '../src/mock/billing';
import { mockBlogs, mockCategories } from '../src/mock/blog';
import { mockConfigs } from '../src/mock/configs';
import { mockConversations } from '../src/mock/conversations';
import { mockJobs } from '../src/mock/jobs';
import { mockLabels } from '../src/mock/labels';
import { mockLogicHistoryEntries } from '../src/mock/logic-history';
import { mockLoginHistoryEntries } from '../src/mock/login-history';
import { mockMailTemplates } from '../src/mock/mail-templates';
import { mockNotificationTemplates } from '../src/mock/notification-templates';
import { mockPermissions } from '../src/mock/permissions';
import { mockPrompts } from '../src/mock/prompts';
import { mockSSOEntries } from '../src/mock/sso';
import { mockUsers } from '../src/mock/users';
import { mockTools } from './mock/tools';
const { mockModels } = require('../src/mock/model');

// Import all repositories
import {
  AgentMemoryRepository,
  AgentRepository,
  AgentTaskRepository,
  AIKeyRepository,
  AIModelRepository,
  AIPlatformRepository,
  BillingRepository,
  BlogRepository,
  CategoryRepository,
  ConfigRepository,
  ConversationRepository,
  EntityLabelRepository,
  FaqRepository,
  LabelRepository,
  LogicHistoryRepository,
  LoginHistoryRepository,
  MessageRepository,
  PermissionRepository,
  PromptHistoryRepository,
  RoleRepository,
  SocketConfigRepository,
  SocketEventRepository,
  SSORepository,
  ToolRepository,
  UIConfigRepository,
  UserRepository,
} from '../src/repositories';
import { RoleSeeder, ToolCommandSeeder } from './seeders';
import { AgentSeeder } from './seeders/agent.seeder';

interface MockModel {
  id: string;
  name: string;
  description?: string;
  [key: string]: any;
}

interface SeedInput<T> {
  where: Record<string, any>;
  create: T;
  update: Partial<T>;
}

const prisma = new PrismaClient();

// Initialize repositories
const aiPlatformRepo = new AIPlatformRepository();
const aiModelRepo = new AIModelRepository();
const aiKeyRepo = new AIKeyRepository();
const labelRepo = new LabelRepository();
const entityLabelRepo = new EntityLabelRepository();
const agentRepo = new AgentRepository();
const categoryRepo = new CategoryRepository();
const blogRepo = new BlogRepository();
const billingRepo = new BillingRepository();
const permissionRepo = new PermissionRepository();
const roleRepo = new RoleRepository();
const userRepo = new UserRepository();
const configRepo = new ConfigRepository();
const ssoRepo = new SSORepository();
const loginHistoryRepo = new LoginHistoryRepository();
const logicHistoryRepo = new LogicHistoryRepository();
const conversationRepo = new ConversationRepository();
const messageRepo = new MessageRepository();
const agentMemoryRepo = new AgentMemoryRepository();
const agentTaskRepo = new AgentTaskRepository();
const toolRepo = new ToolRepository();
const promptHistoryRepo = new PromptHistoryRepository();
const faqRepo = new FaqRepository();
const uiConfigRepo = new UIConfigRepository();
const socketConfigRepo = new SocketConfigRepository();
const socketEventRepo = new SocketEventRepository();

async function main() {
  // Import seeders
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { CoreEntitiesSeeder } = require('./seeders/core-entities.seeder');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { LabelUtilitySeeder } = require('./seeders/label-utility.seeder');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { BasicEntitiesSeeder } = require('./seeders/basic-entities.seeder');

  // Seed core entities (labels first, then AI platforms, models, keys)
  const { createdLabels } = await CoreEntitiesSeeder.instance.run({
    mockAIPlatforms,
    mockModels,
    mockAIKeys,
    mockLabels,
  });

  // Generate labels mapping and get mockLabelId
  const { createdLabelsMap, mockLabelId } = LabelUtilitySeeder.instance.generateLabelsMapping(createdLabels);

  // Get users for relationships
  const [superadminUser, adminUser, regularUser] = await Promise.all([
    prisma.user.findUnique({ where: { email: 'superadmin@example.com' } }),
    prisma.user.findUnique({ where: { email: 'admin@example.com' } }),
    prisma.user.findUnique({ where: { email: 'user@example.com' } }),
  ]);

  // Seed basic entities (tools, categories, blogs, billings)
  await BasicEntitiesSeeder.instance.run({
    mockTools,
    mockCategories,
    mockBlogs,
    mockBillings,
  });
  // Seed FAQs and related messages (moved before agents are needed)
  console.log('❓ Seeding FAQs and FAQ Messages...');

  // We'll seed FAQs after agents are created, so skip for now
  // This section will be moved to after agent creation
  // Seed Prompts - Batch operation
  console.log('💡 Seeding Prompts...');

  // Validate and prepare prompt data in parallel
  const promptValidationResults = await Promise.all(
    mockPrompts.map(async (prompt) => {
      if (!prompt.conversationId) {
        console.warn(`⚠ Skipping prompt: '${prompt.prompt}' (missing conversationId)`);
        return null;
      }

      const convExists = await prisma.conversation.findUnique({
        where: { id: prompt.conversationId },
      });

      if (!convExists) {
        console.warn(
          `⚠ Skipping prompt: '${prompt.prompt}' (invalid conversationId: ${prompt.conversationId})`,
        );
        return null;
      }

      return {
        conversationId: prompt.conversationId,
        prompt: prompt.prompt,
        createdAt: prompt.createdAt,
      };
    }),
  );

  // Filter out invalid prompts and batch create
  const validPrompts = promptValidationResults.filter((p) => p !== null);
  if (validPrompts.length > 0) {
    try {
      await prisma.promptHistory.createMany({
        data: validPrompts,
        skipDuplicates: true,
      });
      console.log(`✓ Created ${validPrompts.length} prompts`);
    } catch (error) {
      console.log(`⚠ Error creating prompts:`, error);
    }
  }

  // Seed Jobs
  console.log('🧑‍💼 Seeding Jobs...');
  for (const job of mockJobs) {
    try {
      await prisma.job.create({
        data: {
          type: job.type,
          status: job.status,
          result: job.result,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        },
      });
    } catch (error) {
      console.log(`⚠ Error creating job:`, error);
    }
  }
  // ...existing code...
  // Seed permissions from mock data - Use repository seed
  console.log('🔐 Seeding Permissions...');

  // Deduplicate mockPermissions by name
  const uniquePermissions = Object.values(
    mockPermissions.reduce((acc: Record<string, any>, perm: any) => {
      acc[perm.name] = perm;
      return acc;
    }, {}),
  );

  const permissionRecords = await permissionRepo.seed(
    uniquePermissions.map((permission: any) => ({
      where: { name: permission.name },
      create: permission,
      update: {},
    })),
  );

  // Add mock label to all permissions - Use batch create
  if (mockLabelId) {
    const permissionLabels = permissionRecords.map((permission: any) => ({
      entityId: permission.id,
      entityType: 'permission',
      labelId: mockLabelId,
    }));

    await entityLabelRepo.createMany(permissionLabels);
  }
  const { superadminRole, adminRole, userRole } = await RoleSeeder.instance.run(permissionRecords);

  // Add mock label to all roles - Use batch create
  if (mockLabelId) {
    const roleLabels = [
      { entityId: superadminRole.id, entityType: 'role', labelId: mockLabelId },
      { entityId: adminRole.id, entityType: 'role', labelId: mockLabelId },
      { entityId: userRole.id, entityType: 'role', labelId: mockLabelId },
    ];

    await entityLabelRepo.createMany(roleLabels);
  }

  // Seed users from mock data - Use repository seed
  console.log('👥 Seeding Users...');
  const roleMapping: Record<string, string> = {
    superadmin: superadminRole.id,
    admin: adminRole.id,
    user: userRole.id,
  };

  const createdUsers = await userRepo.seed(
    mockUsers.map((user: any) => ({
      where: { email: user.email },
      create: {
        email: user.email,
        password: user.password,
        nickname: user.nickname,
        roleId: roleMapping[user.roleName],
        status: user.status,
      },
      update: {},
    })),
  );

  // Add mock label to all users - Use batch create
  if (mockLabelId) {
    const userLabels = createdUsers.map((user: any) => ({
      entityId: user.id,
      entityType: 'user',
      labelId: mockLabelId,
    }));

    await entityLabelRepo.createMany(userLabels);
  }

  // Seed configuration settings from mock data - Use repository seed
  console.log('⚙️ Seeding Configuration...');
  const createdConfigs = await configRepo.seed(
    mockConfigs.map((config: any) => ({
      where: { key: config.key },
      create: config,
      update: { value: config.value },
    })),
  );

  // Add mock label to all configs - Use batch create
  if (mockLabelId) {
    const configLabels = createdConfigs.map((config: any) => ({
      entityId: config.id,
      entityType: 'config',
      labelId: mockLabelId,
    }));

    await entityLabelRepo.createMany(configLabels);
  }
  // Seed mail templates from mock data - Use batch upsert
  console.log('📧 Seeding Mail Templates...');
  const createdMailTemplates = await prisma.mailTemplate.findMany().then(() =>
    Promise.all(
      mockMailTemplates.map((template) =>
        prisma.mailTemplate.upsert({
          where: { name: template.name },
          create: template,
          update: {
            subject: template.subject,
            body: template.body,
            active: template.active,
          },
        }),
      ),
    ),
  );

  // Add mock label to all mail templates - Use batch create
  if (mockLabelId) {
    const mailTemplateLabels = createdMailTemplates.map((template) => ({
      entityId: template.id,
      entityType: 'mailTemplate',
      labelId: mockLabelId,
    }));

    await entityLabelRepo.createMany(mailTemplateLabels);
  }

  // Seed notification templates from mock data - Use batch upsert
  console.log('🔔 Seeding Notification Templates...');
  const createdNotificationTemplates = await Promise.all(
    mockNotificationTemplates.map((template) =>
      prisma.notificationTemplate.upsert({
        where: { name: template.name },
        create: template,
        update: {
          title: template.title,
          body: template.body,
          active: template.active,
        },
      }),
    ),
  );

  // Add mock label to all notification templates - Use batch create
  if (mockLabelId) {
    const notificationTemplateLabels = createdNotificationTemplates.map((template) => ({
      entityId: template.id,
      entityType: 'notificationTemplate',
      labelId: mockLabelId,
    }));

    await entityLabelRepo.createMany(notificationTemplateLabels);
  }

  // Seed SSO entries from mock data - Use repository seed
  console.log('🔐 Seeding SSO Entries...');

  const userEmailToIdMapping: Record<string, string> = {
    'superadmin@example.com': superadminUser?.id || '',
    'admin@example.com': adminUser?.id || '',
    'user@example.com': regularUser?.id || '',
  };

  const ssoEntries = mockSSOEntries.map((sso: any) => ({
    ...sso,
    userId: userEmailToIdMapping[sso.userEmail] || '',
    userEmail: undefined, // Remove the userEmail field as it's not part of the schema
  }));

  const validSSOEntries = ssoEntries.filter((sso: any) => sso.userId);
  const createdSSOEntries = await ssoRepo.seed(
    validSSOEntries.map((sso: any) => ({
      where: { key: sso.key },
      create: sso,
      update: {
        url: sso.url,
        userId: sso.userId,
        deviceIP: sso.deviceIP,
        isActive: sso.isActive,
        expiresAt: sso.expiresAt,
        ...(sso.ssoKey && { ssoKey: sso.ssoKey }),
      },
    })),
  ); // Add mock label to all SSO entries
  if (mockLabelId && createdSSOEntries.length > 0) {
    const ssoLabels = createdSSOEntries.map((sso: any) => ({
      entityId: sso.id,
      entityType: 'sso',
      labelId: mockLabelId,
    }));

    await prisma.entityLabel.createMany({
      data: ssoLabels,
      skipDuplicates: true,
    });
  }

  // Seed Login History from mock data
  console.log('📋 Seeding Login History...');

  // Map SSO keys to created SSO IDs for mock data that uses SSO
  const ssoKeyToIdMapping: Record<string, string> = {};
  createdSSOEntries.forEach((sso: any) => {
    if (sso.ssoKey) {
      ssoKeyToIdMapping[sso.ssoKey] = sso.id;
    }
  });

  const loginHistoryEntries = mockLoginHistoryEntries.map((entry) => ({
    userId: userEmailToIdMapping[entry.userEmail] || '',
    ssoId: entry.ssoKey ? ssoKeyToIdMapping[entry.ssoKey] || null : null,
    deviceIP: entry.deviceIP,
    userAgent: entry.userAgent,
    location: entry.location,
    status: entry.status,
    loginAt: entry.loginAt,
    logoutAt: entry.logoutAt || null,
  })); // Batch create login history entries - check for duplicates first
  const createdLoginHistories: any[] = [];

  // Check for existing entries in batch
  const existingLoginHistoryChecks = await Promise.all(
    loginHistoryEntries
      .filter((entry) => entry.userId)
      .map(async (loginHistory) => {
        const existingEntry = await prisma.loginHistory.findFirst({
          where: {
            userId: loginHistory.userId,
            ssoId: loginHistory.ssoId || null,
            deviceIP: loginHistory.deviceIP,
            loginAt: loginHistory.loginAt,
          },
        });
        return { loginHistory, exists: !!existingEntry, existingEntry };
      }),
  );

  // Batch create new entries
  const newEntries = existingLoginHistoryChecks.filter((check) => !check.exists);
  if (newEntries.length > 0) {
    await prisma.loginHistory.createMany({
      data: newEntries.map((check) => check.loginHistory),
      skipDuplicates: true,
    });

    // Fetch created entries
    const created = await prisma.loginHistory.findMany({
      where: {
        OR: newEntries.map((check) => ({
          userId: check.loginHistory.userId,
          deviceIP: check.loginHistory.deviceIP,
          loginAt: check.loginHistory.loginAt,
        })),
      },
    });
    createdLoginHistories.push(...created);
  }

  // Add existing entries to the list
  createdLoginHistories.push(
    ...existingLoginHistoryChecks
      .filter((check) => check.exists)
      .map((check) => check.existingEntry),
  );

  // Add mock label to all login histories
  if (mockLabelId && createdLoginHistories.length > 0) {
    const loginHistoryLabels = createdLoginHistories.map((history) => ({
      entityId: history.id,
      entityType: 'loginHistory',
      labelId: mockLabelId,
    }));

    await prisma.entityLabel.createMany({
      data: loginHistoryLabels,
      skipDuplicates: true,
    });
  }

  // Seed Logic History from mock data
  console.log('📜 Seeding Logic History...');
  const logicHistoryEntries = mockLogicHistoryEntries.map((entry) => ({
    userId: entry.userEmail ? userEmailToIdMapping[entry.userEmail] : null,
    action: entry.action,
    description: entry.description,
    metadata: entry.metadata,
    createdAt: entry.createdAt,
  })); // Batch create logic history entries - check for duplicates first
  const createdLogicHistories: any[] = [];

  // Process valid entries with userId
  const validLogicEntries = logicHistoryEntries.filter((entry) => entry.userId);

  // Check for existing entries and prepare data in parallel
  const logicHistoryChecks = await Promise.all(
    validLogicEntries.map(async (logicHistory) => {
      try {
        const existingEntry = await prisma.logicHistory.findFirst({
          where: {
            userId: logicHistory.userId!,
            action: logicHistory.action,
            createdAt: {
              gte: new Date(logicHistory.createdAt.getTime() - 5 * 60 * 1000),
              lte: new Date(logicHistory.createdAt.getTime() + 5 * 60 * 1000),
            },
          },
        });

        const data = {
          userId: logicHistory.userId!,
          action: logicHistory.action,
          entityType: 'System',
          entityId: null,
          oldValues: null,
          newValues: JSON.stringify(logicHistory.metadata),
          ipAddress: logicHistory.metadata?.ipAddress || '127.0.0.1',
          userAgent: logicHistory.metadata?.userAgent || 'System',
          notificationTemplateId: null,
          notificationSent: false,
          createdAt: logicHistory.createdAt,
        };

        return { data, exists: !!existingEntry, existingEntry };
      } catch (error) {
        console.log(`⚠ Error processing logic history entry:`, error);
        return null;
      }
    }),
  );

  // Filter out failed checks
  const validChecks = logicHistoryChecks.filter((check) => check !== null);

  // Batch create new entries
  const newLogicEntries = validChecks.filter((check) => !check!.exists);
  if (newLogicEntries.length > 0) {
    await prisma.logicHistory.createMany({
      data: newLogicEntries.map((check) => check!.data),
      skipDuplicates: true,
    });

    // Fetch created entries
    const created = await prisma.logicHistory.findMany({
      where: {
        OR: newLogicEntries.map((check) => ({
          userId: check!.data.userId,
          action: check!.data.action,
          createdAt: check!.data.createdAt,
        })),
      },
    });
    createdLogicHistories.push(...created);
  }

  // Add existing entries
  createdLogicHistories.push(
    ...validChecks.filter((check) => check!.exists).map((check) => check!.existingEntry),
  );

  // Add mock label to all logic histories
  if (mockLabelId && createdLogicHistories.length > 0) {
    const logicHistoryLabels = createdLogicHistories.map((history) => ({
      entityId: history.id,
      entityType: 'logicHistory',
      labelId: mockLabelId,
    }));

    await prisma.entityLabel.createMany({
      data: logicHistoryLabels,
      skipDuplicates: true,
    });
  }

  // Seed AI Agents
  console.log('🤖 Seeding AI Agents...');


  const createdAgents: any[] = await AgentSeeder.run({
    prisma,
    mockAgents,
    superadminUser,
    adminUser,
    regularUser,
    mockLabelId,
  });

  // Add mock label to all agents
  if (mockLabelId && createdAgents.length > 0) {
    const agentLabels = createdAgents.map((agent: any) => ({
      entityId: agent.id,
      entityType: 'agent',
      labelId: mockLabelId,
    }));

    await prisma.entityLabel.createMany({
      data: agentLabels,
      skipDuplicates: true,
    });
  }

  // Seed Agent Memories
  console.log('🧠 Seeding Agent Memories...');

  const agentMemories = mockAgentMemories.map((memory) => ({
    ...memory,
    agentId:
      createdAgents.find(
        (agent: any) => agent.name === mockAgents.find((a: any) => a.id === memory.agentId)?.name,
      )?.id || '',
  }));

  const createdAgentMemories: any[] = [];
  for (const memory of agentMemories) {
    if (memory.agentId) {
      try {
        const existingMemory = await prisma.agentMemory.findFirst({
          where: { agentId: memory.agentId, content: memory.content },
        });

        if (!existingMemory) {
          const createdMemory = await prisma.agentMemory.create({
            data: memory,
          });
          createdAgentMemories.push(createdMemory);
          console.log(`✓ Created memory for agent ${memory.agentId}`);
        } else {
          createdAgentMemories.push(existingMemory);
        }
      } catch (error) {
        console.log(`⚠ Error creating memory:`, error);
      }
    }
  }

  // Add mock label to all agent memories
  if (mockLabelId && createdAgentMemories.length > 0) {
    const agentMemoryLabels = createdAgentMemories.map((memory) => ({
      entityId: memory.id,
      entityType: 'agentMemory',
      labelId: mockLabelId,
    }));

    await prisma.entityLabel.createMany({
      data: agentMemoryLabels,
      skipDuplicates: true,
    });
  }

  // Seed Conversations and Messages
  // Note: Conversations use direct Prisma due to lack of compound unique index
  console.log('💬 Seeding Conversations...');

  // Map mock IDs to actual created agent and user IDs
  const mockToRealMapping: Record<string, string> = {
    'agent-001': createdAgents.find((a: any) => a.name === 'General Assistant')?.id || '',
    'agent-002': createdAgents.find((a: any) => a.name === 'Code Assistant')?.id || '',
    'agent-003': createdAgents.find((a: any) => a.name === 'Business Analyst')?.id || '',
    'agent-004': createdAgents.find((a: any) => a.name === 'Creative Writer')?.id || '',
    'agent-005': createdAgents.find((a: any) => a.name === 'Learning Companion')?.id || '',
    'super-admin-id': superadminUser?.id || '',
    'admin-id': adminUser?.id || '',
    'user-id': regularUser?.id || '',
  };

  const conversations = mockConversations.map((conv) => ({
    agentId: mockToRealMapping[conv.agentId] || '',
    userId: mockToRealMapping[conv.userId] || '',
    title: conv.title,
    summary: conv.summary,
    isActive: conv.isActive,
  }));

  const createdConversations: any[] = [];
  for (const conversation of conversations) {
    if (conversation.agentId && conversation.userId) {
      try {
        const existingConversation = await prisma.conversation.findFirst({
          where: {
            agentId: conversation.agentId,
            userId: conversation.userId,
            title: conversation.title,
          },
        });

        if (!existingConversation) {
          const createdConversation = await prisma.conversation.create({
            data: conversation,
          });
          createdConversations.push(createdConversation);
          console.log(`✓ Created conversation: ${conversation.title}`);
        } else {
          createdConversations.push(existingConversation);
          console.log(`✓ Found existing conversation: ${conversation.title}`);
        }
      } catch (error) {
        console.log(`⚠ Error creating conversation:`, error);
      }
    }
  }

  // Add mock label to all conversations
  if (mockLabelId && createdConversations.length > 0) {
    const conversationLabels = createdConversations.map((conversation: any) => ({
      entityId: conversation.id,
      entityType: 'conversation',
      labelId: mockLabelId,
    }));

    await entityLabelRepo.createMany(conversationLabels);
  }

  // Seed Messages with position tracking
  // Note: Messages use direct Prisma due to complex nested relationship with conversations
  console.log('📝 Seeding Messages...');

  const createdMessages: any[] = [];
  // Create messages for each conversation from mock data
  for (let i = 0; i < mockConversations.length && i < createdConversations.length; i++) {
    const mockConv = mockConversations[i];
    const realConv = createdConversations[i] as any;

    if (mockConv.messages && realConv?.id) {
      for (const message of mockConv.messages) {
        try {
          const existingMessage = await prisma.message.findFirst({
            where: {
              conversationId: realConv.id,
              content: message.content,
              position: message.position,
            },
          });

          if (!existingMessage) {
            const createdMessage = await prisma.message.create({
              data: {
                conversationId: realConv.id,
                sender: message.sender,
                content: message.content,
                position: message.position,
                tokens: message.tokens || null,
                metadata: message.metadata || null,
              },
            });
            createdMessages.push(createdMessage);
            console.log(
              `✓ Created message ${message.position} in conversation "${mockConv.title}"`,
            );
          } else {
            createdMessages.push(existingMessage);
          }
        } catch (error) {
          console.log(`⚠ Error creating message:`, error);
        }
      }
    }
  }

  // Add mock label to all messages
  if (mockLabelId && createdMessages.length > 0) {
    const messageLabels = createdMessages.map((message) => ({
      entityId: message.id,
      entityType: 'message',
      labelId: mockLabelId,
    }));

    await entityLabelRepo.createMany(messageLabels);
  }

  // Seed Agent Tools (many-to-many)
  console.log('🛠️ Seeding Agent Tools...');

  // First, ensure all tools exist
  const toolNameToId: Record<string, string> = {};
  for (const tool of mockTools) {
    let dbTool = await prisma.tool.findUnique({ where: { name: tool.name } });
    if (!dbTool) {
      dbTool = await prisma.tool.create({ data: tool });
    }
    toolNameToId[tool.name] = dbTool.id;
  }

  // Now, create AgentTool join records
  const agentTools = mockAgentTools.map((at) => {
    const agentId = createdAgents.find(
      (agent: any) => agent.name === mockAgents.find((a: any) => a.id === at.agentId)?.name,
    )?.id;
    const toolId = toolNameToId[at.name];
    return agentId && toolId ? { agentId, toolId } : null;
  }).filter(Boolean);

  const createdAgentTools: any[] = [];
  for (const at of agentTools) {
    try {
      const existing = await prisma.agentTool.findUnique({
        where: { agentId_toolId: { agentId: at.agentId, toolId: at.toolId } },
      });
      if (!existing) {
        const created = await prisma.agentTool.create({ data: at });
        createdAgentTools.push(created);
        console.log(`✓ Linked agent ${at.agentId} to tool ${at.toolId}`);
      } else {
        createdAgentTools.push(existing);
      }
    } catch (error) {
      console.log(`⚠ Error linking agent-tool:`, error);
    }
  }

  // Add mock label to all agent-tool links (optional, or label tools only)
  if (mockLabelId && createdAgentTools.length > 0) {
    const agentToolLabels = createdAgentTools.map((at) => ({
      entityId: at.toolId,
      entityType: 'tool',
      labelId: mockLabelId,
    }));
    await entityLabelRepo.createMany(agentToolLabels);
  }

  // Seed Agent Tasks
  // Note: Agent Tasks kept as direct Prisma due to complex include for logging
  console.log('📋 Seeding Agent Tasks...');

  const agentTasks = mockAgentTasks.map((task: any) => ({
    ...task,
    agentId:
      createdAgents.find(
        (agent: any) => agent.name === mockAgents.find((a: any) => a.id === task.agentId)?.name,
      )?.id || '',
  }));

  const createdAgentTasks: any[] = [];
  for (const task of agentTasks) {
    if (task.agentId) {
      try {
        const existingTask = await prisma.agentTask.findFirst({
          where: { agentId: task.agentId, name: task.name },
        });

        if (!existingTask) {
          const createdTask = await prisma.agentTask.create({
            data: task,
            include: {
              agent: {
                select: {
                  name: true,
                  user: {
                    select: { nickname: true },
                  },
                },
              },
            },
          });
          createdAgentTasks.push(createdTask);
          console.log(
            `✓ Created task "${task.name}" for agent ${createdTask.agent?.name} (Status: ${task.status}, Owner: ${createdTask.agent?.user?.nickname})`,
          );
        } else {
          createdAgentTasks.push(existingTask);
          console.log(`⚠ Task already exists: ${task.name} (Status: ${existingTask.status})`);
        }
      } catch (error) {
        console.log(`⚠ Error creating task:`, error);
      }
    }
  }

  // Add mock label to all agent tasks
  if (mockLabelId && createdAgentTasks.length > 0) {
    const agentTaskLabels = createdAgentTasks.map((task) => ({
      entityId: task.id,
      entityType: 'agentTask',
      labelId: mockLabelId,
    }));

    await entityLabelRepo.createMany(agentTaskLabels);
  }

  // Seed Database Connections
  console.log('🔌 Seeding Database Connections...');
  // Import modular mock database connections
  const { getMockDatabaseConnections } = require('../src/mock/dbConnections');
  const mockDatabaseConnections = getMockDatabaseConnections(
    superadminUser?.id || '',
    adminUser?.id || '',
  );
  const createdDatabaseConnections: any[] = [];
  for (const dbConn of mockDatabaseConnections) {
    try {
      const existingConn = await prisma.databaseConnection.findUnique({
        where: { name: dbConn.name },
      });
      if (!existingConn) {
        const createdConn = await prisma.databaseConnection.create({ data: dbConn });
        createdDatabaseConnections.push(createdConn);
        console.log(`✓ Created database connection: ${dbConn.name}`);
      } else {
        createdDatabaseConnections.push(existingConn);
        console.log(`✓ Found existing database connection: ${dbConn.name}`);
      }
    } catch (error) {
      console.log(`⚠ Error creating database connection ${dbConn.name}:`, error);
    }
  }
  // Add mock label to all database connections
  if (mockLabelId && createdDatabaseConnections.length > 0) {
    const dbConnLabels = createdDatabaseConnections.map((conn) => ({
      entityId: conn.id,
      entityType: 'databaseConnection',
      labelId: mockLabelId,
    }));
    await prisma.entityLabel.createMany({
      data: dbConnLabels,
      skipDuplicates: true,
    });
  }

  // Seed UI Configs for sidebar/menu
  console.log('🖥️ Seeding UI Configs...');
  // Import sidebar menu config from mock file
  const { defaultSidebarMenu } = require('../src/mock/sidebarMenu');

  const uiConfigs = [
    {
      where: { name: 'sidebar-superadmin' },
      create: {
        name: 'sidebar-superadmin',
        value: JSON.stringify(defaultSidebarMenu),
        role: 'superadmin',
      },
      update: { value: JSON.stringify(defaultSidebarMenu), role: 'superadmin' },
    },
    {
      where: { name: 'sidebar-admin' },
      create: {
        name: 'sidebar-admin',
        value: JSON.stringify(defaultSidebarMenu),
        role: 'admin',
      },
      update: { value: JSON.stringify(defaultSidebarMenu), role: 'admin' },
    },
    {
      where: { name: 'sidebar-user' },
      create: {
        name: 'sidebar-user',
        value: JSON.stringify(defaultSidebarMenu),
        role: 'user',
      },
      update: { value: JSON.stringify(defaultSidebarMenu), role: 'user' },
    },
  ];

  await uiConfigRepo.seed(uiConfigs);

  // Seed mock socket and events
  console.log('🔌 Seeding Socket Configs...');
  const mockSocket = await socketConfigRepo.seed([
    {
      where: { id: 'mock-socket' },
      create: {
        id: 'mock-socket',
        name: 'Mock Socket',
        host: 'localhost',
        port: 4001,
        isActive: true,
      },
      update: {},
    },
  ]);

  // Seed Socket Events
  // Note: SocketEvents use direct Prisma due to lack of compound unique index on (socketConfigId, type, event)
  console.log('📡 Seeding Socket Events...');
  if (mockSocket && mockSocket.length > 0) {
    const socketId = (mockSocket[0] as any).id;
    const socketEventsData = [
      { socketConfigId: socketId, type: 'user', event: 'user_joined' },
      { socketConfigId: socketId, type: 'user', event: 'user_left' },
      { socketConfigId: socketId, type: 'message', event: 'message' },
    ];

    const createdSocketEvents: any[] = [];
    for (const eventData of socketEventsData) {
      try {
        const existingEvent = await prisma.socketEvent.findFirst({
          where: {
            socketConfigId: eventData.socketConfigId,
            type: eventData.type,
            event: eventData.event,
          },
        });

        if (!existingEvent) {
          const createdEvent = await prisma.socketEvent.create({
            data: eventData,
          });
          createdSocketEvents.push(createdEvent);
          console.log(`✓ Created socket event: ${eventData.type}/${eventData.event}`);
        } else {
          createdSocketEvents.push(existingEvent);
          console.log(`✓ Found existing socket event: ${eventData.type}/${eventData.event}`);
        }
      } catch (error) {
        console.log(`⚠ Error creating socket event:`, error);
      }
    }

    // Add mock label to all socket events
    if (mockLabelId && createdSocketEvents.length > 0) {
      const socketEventLabels = createdSocketEvents.map((event) => ({
        entityId: event.id,
        entityType: 'socketEvent',
        labelId: mockLabelId,
      }));

      await entityLabelRepo.createMany(socketEventLabels);
    }
  }

  console.log('✅ AI seeding completed successfully!');

  // Summary of EntityLabel relationships created
  if (mockLabelId) {
    const totalEntityLabels = await entityLabelRepo.count({
      labelId: mockLabelId,
    });
    console.log(`🏷️ Created ${totalEntityLabels} EntityLabel relationships with 'mock' label`);

    // Show breakdown by entity type using repository
    const labelBreakdown = await entityLabelRepo.groupBy(['entityType'], {
      where: { labelId: mockLabelId },
      _count: { entityType: true },
    });

    console.log('📊 EntityLabel breakdown by type:');
    labelBreakdown.forEach((item: any) => {
      console.log(`  - ${item.entityType}: ${item._count.entityType}`);
    });
  }

  await ToolCommandSeeder.instance.run();

  console.log('✅ Seeding completed successfully!');
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
    process.exit(1);
  });
