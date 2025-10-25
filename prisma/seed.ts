/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import { mockAgentMemories, mockAgents, mockAgentTasks, mockAgentTools } from '../src/mock/agents';
import { mockAIKeys } from '../src/mock/aiKey';
import { mockAIPlatforms } from '../src/mock/aiPlatform';
import { mockBillings } from '../src/mock/billing';
import { mockBlogs, mockCategories } from '../src/mock/blog';
import { mockConfigs } from '../src/mock/configs';
import { mockConversations } from '../src/mock/conversations';
import { mockFaqs } from '../src/mock/faq';
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
  AIPlatformRepository,
  AIModelRepository,
  AIKeyRepository,
  LabelRepository,
  EntityLabelRepository,
  AgentRepository,
  CategoryRepository,
  BlogRepository,
  BillingRepository,
  PermissionRepository,
  RoleRepository,
  UserRepository,
  ConfigRepository,
  SSORepository,
  LoginHistoryRepository,
  LogicHistoryRepository,
  ConversationRepository,
  MessageRepository,
  AgentMemoryRepository,
  AgentTaskRepository,
  ToolRepository,  PromptHistoryRepository,
  FaqRepository,
} from '../src/repositories';

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

async function main() {
  // 1. Seed AI Platforms - Use batch upsert
  console.log('🤖 Seeding AI Platforms...');
  await aiPlatformRepo.upsertMany(
    mockAIPlatforms.map(platform => ({
      where: { id: platform.id },
      create: platform,
      update: {},
    }))
  );

  // 1a. Seed AI Models - Use batch create with validation
  console.log('🧠 Seeding AI Models...');
  const allPlatforms = await aiPlatformRepo.search<any>({});
  const modelData = mockModels.map((model: any) => {
    const platform = allPlatforms.find((p: any) => p.name === model.platform);
    return {
      where: { name: model.name },
      create: {
        name: model.name,
        description: model.description,
        type: model.type,
        platformId: platform ? platform.id : undefined,
      },
      update: {},
    };
  });
  await aiModelRepo.upsertMany(modelData);

  // After models and agents are seeded, assign modelId to agents
  const allModels = await aiModelRepo.search<any>({});
  const allAgents = await agentRepo.search<any>({});
  if (allModels.length > 0 && allAgents.length > 0) {
    const modelId = allModels[0]?.id;
    const agentsToUpdate = allAgents.filter((agent: any) => !agent.modelId);
    if (modelId && agentsToUpdate.length > 0) {
      await agentRepo.updateMany({ modelId: null }, { modelId });
    }
  }

  // 2. Seed AI Keys - Use batch upsert
  console.log('🔑 Seeding AI Keys...');
  const validKeys = mockAIKeys.filter(key => {
    if (key.platformId && !mockAIPlatforms.find((p) => p.id === key.platformId)) {
      console.warn(`⚠️ Skipping AI Key '${key.id}' (invalid platformId: ${key.platformId})`);
      return false;
    }
    return true;
  });
  
  await aiKeyRepo.upsertMany(
    validKeys.map(key => ({
      where: { id: key.id },
      create: key,
      update: {},
    }))
  );
  console.log(`✓ Seeded ${validKeys.length} AI Keys`);

  // 3. Seed Labels - Use batch upsert
  console.log('🏷️ Seeding Labels...');
  const createdLabels = await labelRepo.upsertMany(
    mockLabels.map(label => ({
      where: { name: label.name },
      create: { name: label.name, color: label.color },
      update: { color: label.color },
    }))
  );
  
  const createdLabelsMap: Record<string, any> = {};
  createdLabels.forEach((label: any) => {
    createdLabelsMap[label.name] = label;
  });
  const mockLabelId = createdLabelsMap['mock']?.id;

  // Get users for seeding agents and other entities
  const superadminUser = await prisma.user.findUnique({
    where: { email: 'superadmin@example.com' },
  });
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
  const regularUser = await prisma.user.findUnique({ where: { email: 'user@example.com' } });

  // 4. Seed AI Agents before any other AI-related data
  // Map mock agent IDs to actual user IDs (will be used later)
  const agentUserMapping: Record<string, string> = {
    'super-admin-id': superadminUser?.id || '',
    'admin-id': adminUser?.id || '',
    'user-id': regularUser?.id || '',
  };

  // Explicitly type aiAgents as Prisma.AgentCreateInput[]
  const aiAgents: Parameters<typeof prisma.agent.create>[0]['data'][] = [];
  for (const agent of mockAgents) {
    let modelConnect: any = undefined;
    if (agent.model) {
      const model = await prisma.aIModel.findUnique({ where: { name: agent.model } });
      if (model) modelConnect = { connect: { id: model.id } };
    }
    const { model, ownerId, id, ...agentData } = agent;
    aiAgents.push({
      ...agentData,
      user: { connect: { id: agentUserMapping[ownerId] || '' } },
      ...(modelConnect ? { model: modelConnect } : {}),
    });
  }

  const createdAgents: any[] = [];

  for (const agent of aiAgents) {
    if (agent.user && agent.user.connect && agent.user.connect.id) {
      try {
        const existingAgent = await prisma.agent.findFirst({
          where: { userId: agent.user.connect.id, name: agent.name },
          include: {
            user: {
              select: { id: true, email: true, nickname: true, status: true },
            },
          },
        });

        if (!existingAgent) {
          const createdAgent = await prisma.agent.create({ data: agent });
          createdAgents.push(createdAgent);
          console.log(
            `✓ Created AI agent: ${agent.name} (Status: ${agent.isActive ? 'Active' : 'Inactive'})`
          );
        } else {
          createdAgents.push(existingAgent);
          console.log(
            `⚠ Agent already exists: ${agent.name} (Owner: ${existingAgent.user?.nickname}, Status: ${existingAgent.isActive ? 'Active' : 'Inactive'})`
          );
        }
      } catch (error) {
        console.log(`⚠ Error creating agent ${agent.name}:`, error);
      }
    }
  }
  // 4.1 Seed Tools (global tools) - Use batch upsert
  console.log('🛠️ Seeding Tools...');
  await toolRepo.upsertMany(
    mockTools.map(tool => ({
      where: { name: tool.name },
      create: tool,
      update: {
        description: tool.description,
        type: tool.type,
        config: tool.config,
        enabled: tool.enabled,
      },
    }))
  );

  // 5. Seed Categories - Use batch upsert
  console.log('📚 Seeding Categories...');
  await categoryRepo.upsertMany(
    mockCategories.map(category => ({
      where: { id: category.id },
      create: category,
      update: {},
    }))
  );

  // 6. Seed Blogs - Use batch upsert
  console.log('📝 Seeding Blogs...');
  await blogRepo.upsertMany(
    mockBlogs.map(blog => ({
      where: { id: blog.id },
      create: blog,
      update: {},
    }))
  );

  // 7. Seed Billings - Use batch upsert
  console.log('💳 Seeding Billings...');
  await billingRepo.upsertMany(
    mockBillings.map(billing => ({
      where: { id: billing.id },
      create: billing,
      update: {},
    }))
  );
  // ...existing code...
  // Seed FAQs and related messages (moved to end)
  console.log('❓ Seeding FAQs and FAQ Messages...');
  // Build a mapping from mock agent IDs (names or symbolic IDs) to real agent IDs
  const agentIdMap: Record<string, string> = {};
  for (const agent of allAgents) {
    // Map by name and by id for flexibility
    agentIdMap[agent.name] = agent.id;
    agentIdMap[agent.id] = agent.id;
  }

  // Build a mapping from mock prompt IDs (symbolic or actual) to real PromptHistory IDs
  const allPrompts = await prisma.promptHistory.findMany();
  const promptIdMap: Record<string, string> = {};
  for (const prompt of allPrompts) {
    // Map by prompt text and by id for flexibility
    promptIdMap[prompt.prompt] = prompt.id;
    promptIdMap[prompt.id] = prompt.id;
  }

  for (const faq of mockFaqs) {
    let mappedAgentId: string | undefined = undefined;
    if ((faq as any).aiAgentId) {
      mappedAgentId = agentIdMap[(faq as any).aiAgentId] || undefined;
    }
    let mappedPromptId: string | undefined = undefined;
    if ((faq as any).promptId) {
      mappedPromptId = promptIdMap[(faq as any).promptId] || undefined;
    }
    const faqData: any = {
      question: faq.question,
      answer: faq.answer,
      type: faq.type,
      conversationId: (faq as any).conversationId || undefined,
      createdAt: faq.createdAt,
      updatedAt: faq.updatedAt,
    };
    if (mappedAgentId !== undefined) {
      faqData.aiAgentId = mappedAgentId;
    }
    if (mappedPromptId !== undefined) {
      faqData.promptId = mappedPromptId;
    }
    const createdFaq = await prisma.faq.create({
      data: faqData,
    });

    // Create a new conversation for FAQ messages if not mapped
    let conversationId = (faq as any).conversationId;
    if (!conversationId) {
      const agentId = (faq as any).aiAgentId;
      const userId = (faq as any).userId;
      if (!agentId || !userId) {
        console.warn(
          `⚠️ Skipping FAQ conversation creation for question: '${faq.question}' (missing agentId or userId)`,
        );
        continue;
      }
      const conv = await prisma.conversation.create({
        data: {
          agentId,
          userId,
          title: `FAQ: ${faq.question}`,
          summary: faq.answer,
          isActive: true,
        },
      });
      conversationId = conv.id;
      // Update FAQ with conversationId
      await prisma.faq.update({ where: { id: createdFaq.id }, data: { conversationId } });
    }

    // Create messages for FAQ (question/answer)
    for (const [idx, msg] of (faq.messages || []).entries()) {
      await prisma.message.create({
        data: {
          conversation: { connect: { id: conversationId } },
          sender: msg.sender,
          content: msg.content,
          faq: { connect: { id: createdFaq.id } },
          position: idx + 1,
        },
      });
    }
  }
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
    })
  );

  // Filter out invalid prompts and batch create
  const validPrompts = promptValidationResults.filter(p => p !== null);
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
  // Seed permissions from mock data - Use batch upsert
  console.log('🔐 Seeding Permissions...');

  // Deduplicate mockPermissions by name
  const uniquePermissions = Object.values(
    mockPermissions.reduce((acc: Record<string, any>, perm: any) => {
      acc[perm.name] = perm;
      return acc;
    }, {}),
  );

  const permissionRecords = await permissionRepo.upsertMany(
    uniquePermissions.map((permission: any) => ({
      where: { name: permission.name },
      create: permission,
      update: {},
    }))
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
  // Create roles
  console.log('👑 Seeding Roles...');
  const superadminRole = await prisma.role.upsert({
    where: { name: 'superadmin' },
    update: {
      permissions: {
        set: permissionRecords.map((p: any) => ({ id: p.id })), // Update to include all permissions
      },
    },
    create: {
      name: 'superadmin',
      permissions: {
        connect: permissionRecords.map((p: any) => ({ id: p.id })),
      },
    },
  });
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {
      permissions: {
        set: permissionRecords
          .filter((p: any) => {
            // Dynamically fetch all permission names from mockPermissions
            const adminPermissionNames = mockPermissions.map((perm: any) => perm.name);
            return adminPermissionNames.includes(p.name);
          })
          .map((p: any) => ({ id: p.id })),
      },
    },
    create: {
      name: 'admin',
      permissions: {
        connect: permissionRecords
          .filter((p: any) =>
            [
              'manage_users',
              'view_reports',
              'admin_login_history_get',
              'admin_logic_history_get',
              'admin_cache_get',
              'admin_cache_post',
              'admin_cache_delete',
              'admin_conversations_get',
              'admin_conversations_get_single',
              'admin_conversations_post',
              'admin_conversations_put',
              'admin_conversations_delete',
              'admin_conversations_messages_get',
              'admin_conversations_messages_post',
              'admin_messages_get',
              'admin_messages_post',
              'admin_agents_get',
              'admin_agents_get_single',
              'admin_agents_post',
              'admin_agents_put',
              'admin_agents_delete',
              'admin_agents_memories_get',
              'admin_agents_memories_post',
              'view_conversations',
              'create_conversations',
              'view_messages',
              'send_messages',
              'view_ai_agents',
              'chat_with_agents',
              // Database connection permissions
              'admin_database_connections_get',
              'admin_database_connections_post',
              'admin_database_connections_put',
              'admin_database_connections_delete',
              'admin_database_connections_test',
              'admin_database_connections_check',
              'admin_database_connections_backup',
              'admin_database_connections_stats',
              'view_database_connections',
              'manage_database_connections',
              'create_database_connections',
              'update_database_connections',
              'delete_database_connections',
              'test_database_connections',
              'backup_databases',
              // Log management permissions
              'admin_logs_get',
              'admin_logs_post',
              'admin_logs_stats',
              'admin_logs_export',
              'admin_logs_clear',
              'view_logs',
              'manage_logs',
              'create_logs',
            ].includes(p.name),
          )
          .map((p: any) => ({ id: p.id })),
      },
    },
  });
  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {
      permissions: {
        set: permissionRecords
          .filter((p: any) =>
            [
              'view_self',
              'view_conversations',
              'create_conversations',
              'view_messages',
              'send_messages',
              'view_ai_agents',
              'chat_with_agents',
            ].includes(p.name),
          )
          .map((p: any) => ({ id: p.id })),
      },
    },
    create: {
      name: 'user',
      permissions: {
        connect: permissionRecords
          .filter((p: any) =>
            [
              'view_self',
              'view_conversations',
              'create_conversations',
              'view_messages',
              'send_messages',
              'view_ai_agents',
              'chat_with_agents',
            ].includes(p.name),
          )
          .map((p: any) => ({ id: p.id })),
      },
    },
  });
  // Add mock label to all roles - Use batch create
  if (mockLabelId) {
    const roleLabels = [
      { entityId: superadminRole.id, entityType: 'role', labelId: mockLabelId },
      { entityId: adminRole.id, entityType: 'role', labelId: mockLabelId },
      { entityId: userRole.id, entityType: 'role', labelId: mockLabelId },
    ];

    await entityLabelRepo.createMany(roleLabels);
  }

  // Seed users from mock data - Use batch upsert
  console.log('👥 Seeding Users...');
  const roleMapping: Record<string, string> = {
    superadmin: superadminRole.id,
    admin: adminRole.id,
    user: userRole.id,
  };

  const createdUsers = await userRepo.upsertMany(
    mockUsers.map(user => ({
      where: { email: user.email },
      create: {
        email: user.email,
        password: user.password,
        nickname: user.nickname,
        roleId: roleMapping[user.roleName],
        status: user.status,
      },
      update: {},
    }))
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

  // Seed configuration settings from mock data - Use batch upsert
  console.log('⚙️ Seeding Configuration...');
  const createdConfigs = await configRepo.upsertMany(
    mockConfigs.map(config => ({
      where: { key: config.key },
      create: config,
      update: { value: config.value },
    }))
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
      mockMailTemplates.map(template =>
        prisma.mailTemplate.upsert({
          where: { name: template.name },
          create: template,
          update: {
            subject: template.subject,
            body: template.body,
            active: template.active,
          },
        })
      )
    )
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
    mockNotificationTemplates.map(template =>
      prisma.notificationTemplate.upsert({
        where: { name: template.name },
        create: template,
        update: {
          title: template.title,
          body: template.body,
          active: template.active,
        },
      })
    )
  );

  // Add mock label to all notification templates - Use batch create
  if (mockLabelId) {
    const notificationTemplateLabels = createdNotificationTemplates.map((template) => ({
      entityId: template.id,
      entityType: 'notificationTemplate',
      labelId: mockLabelId,
    }));
    // Get users for SSO seeding
    // (Already declared above)

    // Get users for SSO seeding
    const superadminUser = await prisma.user.findUnique({
      where: { email: 'superadmin@example.com' },
    });
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
    const regularUser = await prisma.user.findUnique({ where: { email: 'user@example.com' } });

    // TODO: Uncomment SSO seeding after running 'npx prisma generate'

    // Seed SSO entries from mock data
    console.log('🔐 Seeding SSO Entries...');
    const userEmailToIdMapping: Record<string, string> = {
      'superadmin@example.com': superadminUser?.id || '',
      'admin@example.com': adminUser?.id || '',
      'user@example.com': regularUser?.id || '',
    };

    const ssoEntries = mockSSOEntries.map((sso) => ({
      ...sso,
      userId: userEmailToIdMapping[sso.userEmail] || '',
      userEmail: undefined, // Remove the userEmail field as it's not part of the schema
    }));    // Batch upsert SSO entries using repository pattern
    const validSSOEntries = ssoEntries.filter(sso => sso.userId);
    const createdSSOEntries = await ssoRepo.upsertMany(
      validSSOEntries.map(sso => ({
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
      }))
    );    // Add mock label to all SSO entries
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
    }));    // Batch create login history entries - check for duplicates first
    const createdLoginHistories: any[] = [];
    
    // Check for existing entries in batch
    const existingLoginHistoryChecks = await Promise.all(
      loginHistoryEntries
        .filter(entry => entry.userId)
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
        })
    );

    // Batch create new entries
    const newEntries = existingLoginHistoryChecks.filter(check => !check.exists);
    if (newEntries.length > 0) {
      await prisma.loginHistory.createMany({
        data: newEntries.map(check => check.loginHistory),
        skipDuplicates: true,
      });
      
      // Fetch created entries
      const created = await prisma.loginHistory.findMany({
        where: {
          OR: newEntries.map(check => ({
            userId: check.loginHistory.userId,
            deviceIP: check.loginHistory.deviceIP,
            loginAt: check.loginHistory.loginAt,
          })),
        },
      });
      createdLoginHistories.push(...created);
    }
    
    // Add existing entries to the list
    createdLoginHistories.push(...existingLoginHistoryChecks.filter(check => check.exists).map(check => check.existingEntry));

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
    }));    // Batch create logic history entries - check for duplicates first
    const createdLogicHistories: any[] = [];
    
    // Process valid entries with userId
    const validLogicEntries = logicHistoryEntries.filter(entry => entry.userId);
    
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
      })
    );

    // Filter out failed checks
    const validChecks = logicHistoryChecks.filter(check => check !== null);
    
    // Batch create new entries
    const newLogicEntries = validChecks.filter(check => !check!.exists);
    if (newLogicEntries.length > 0) {
      await prisma.logicHistory.createMany({
        data: newLogicEntries.map(check => check!.data),
        skipDuplicates: true,
      });
      
      // Fetch created entries
      const created = await prisma.logicHistory.findMany({
        where: {
          OR: newLogicEntries.map(check => ({
            userId: check!.data.userId,
            action: check!.data.action,
            createdAt: check!.data.createdAt,
          })),
        },
      });
      createdLogicHistories.push(...created);
    }
    
    // Add existing entries
    createdLogicHistories.push(...validChecks.filter(check => check!.exists).map(check => check!.existingEntry));

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

    // Map mock agent IDs to actual user IDs
    const agentUserMapping: Record<string, string> = {
      'super-admin-id': superadminUser?.id || '',
      'admin-id': adminUser?.id || '',
      'user-id': regularUser?.id || '',
    };

    // Explicitly type aiAgents as Prisma.AgentCreateInput[]
    const aiAgents: Parameters<typeof prisma.agent.create>[0]['data'][] = [];
    for (const agent of mockAgents) {
      let modelConnect: any = undefined;
      if (agent.model) {
        const model = await prisma.aIModel.findUnique({ where: { name: agent.model } });
        if (model) modelConnect = { connect: { id: model.id } };
      }
      const { model, ownerId, id, ...agentData } = agent;
      aiAgents.push({
        ...agentData,
        user: { connect: { id: agentUserMapping[ownerId] || '' } },
        ...(modelConnect ? { model: modelConnect } : {}),
      });
    }

    const createdAgents: any[] = [];
    for (const agent of aiAgents) {
      if (agent.user && agent.user.connect && agent.user.connect.id) {
        try {
          const existingAgent = await prisma.agent.findFirst({
            where: { userId: agent.user.connect.id, name: agent.name },
            include: {
              user: {
                select: { id: true, email: true, nickname: true, status: true },
              },
            },
          });

          if (!existingAgent) {
            const createdAgent = await prisma.agent.create({ data: agent });
            createdAgents.push(createdAgent);
            console.log(
              `✓ Created AI agent: ${agent.name} (Status: ${agent.isActive ? 'Active' : 'Inactive'})`
            );
          } else {
            createdAgents.push(existingAgent);
            console.log(
              `⚠ Agent already exists: ${agent.name} (Owner: ${existingAgent.user?.nickname}, Status: ${existingAgent.isActive ? 'Active' : 'Inactive'})`
            );
          }
        } catch (error) {
          console.log(`⚠ Error creating agent ${agent.name}:`, error);
        }
      }
    }

    // Add mock label to all agents
    if (mockLabelId && createdAgents.length > 0) {
      const agentLabels = createdAgents.map((agent) => ({
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
          (agent) => agent.name === mockAgents.find((a) => a.id === memory.agentId)?.name,
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
    console.log('💬 Seeding Conversations...');

    // Map mock IDs to actual created agent and user IDs
    const mockToRealMapping: Record<string, string> = {
      'agent-001': createdAgents.find((a) => a.name === 'General Assistant')?.id || '',
      'agent-002': createdAgents.find((a) => a.name === 'Code Assistant')?.id || '',
      'agent-003': createdAgents.find((a) => a.name === 'Business Analyst')?.id || '',
      'agent-004': createdAgents.find((a) => a.name === 'Creative Writer')?.id || '',
      'agent-005': createdAgents.find((a) => a.name === 'Learning Companion')?.id || '',
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
            include: {
              user: {
                select: { id: true, email: true, nickname: true, status: true },
              },
              agent: {
                select: { id: true, name: true, description: true, model: true, isActive: true },
              },
            },
          });

          if (!existingConversation) {
            const createdConversation = await prisma.conversation.create({
              data: conversation,
              include: {
                user: {
                  select: { id: true, email: true, nickname: true, status: true },
                },
                agent: {
                  select: { id: true, name: true, description: true, model: true, isActive: true },
                },
              },
            });
            createdConversations.push(createdConversation);
            console.log(
              `✓ Created conversation: ${conversation.title} (User: ${createdConversation.user?.nickname}, Agent: ${createdConversation.agent?.name}, Status: ${conversation.isActive ? 'Active' : 'Inactive'})`,
            );
          } else {
            createdConversations.push(existingConversation);
            console.log(
              `✓ Found existing conversation: ${conversation.title} (Status: ${existingConversation.isActive ? 'Active' : 'Inactive'})`,
            );
          }
        } catch (error) {
          console.log(`⚠ Error creating conversation:`, error);
        }
      }
    }

    // Add mock label to all conversations
    if (mockLabelId && createdConversations.length > 0) {
      const conversationLabels = createdConversations.map((conversation) => ({
        entityId: conversation.id,
        entityType: 'conversation',
        labelId: mockLabelId,
      }));

      await prisma.entityLabel.createMany({
        data: conversationLabels,
        skipDuplicates: true,
      });
    }

    // Seed Messages with position tracking
    console.log('📝 Seeding Messages...');

    const createdMessages: any[] = [];
    // Create messages for each conversation from mock data
    for (let i = 0; i < mockConversations.length && i < createdConversations.length; i++) {
      const mockConv = mockConversations[i];
      const realConv = createdConversations[i];

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

      await prisma.entityLabel.createMany({
        data: messageLabels,
        skipDuplicates: true,
      });
    }

    // Seed Agent Tools
    console.log('🛠️ Seeding Agent Tools...');

    const agentTools = mockAgentTools.map((tool) => ({
      ...tool,
      agentId:
        createdAgents.find(
          (agent) => agent.name === mockAgents.find((a) => a.id === tool.agentId)?.name,
        )?.id || '',
    }));

    const createdAgentTools: any[] = [];
    for (const tool of agentTools) {
      if (tool.agentId) {
        try {
          const existingTool = await prisma.tool.findFirst({
            where: { agentId: tool.agentId, name: tool.name },
          });

          if (!existingTool) {
            const createdTool = await prisma.tool.create({
              data: tool,
            });
            createdAgentTools.push(createdTool);
            console.log(`✓ Created tool ${tool.name} for agent ${tool.agentId}`);
          } else {
            createdAgentTools.push(existingTool);
          }
        } catch (error) {
          console.log(`⚠ Error creating tool:`, error);
        }
      }
    }

    // Add mock label to all agent tools
    if (mockLabelId && createdAgentTools.length > 0) {
      const agentToolLabels = createdAgentTools.map((tool) => ({
        entityId: tool.id,
        entityType: 'tool',
        labelId: mockLabelId,
      }));

      await prisma.entityLabel.createMany({
        data: agentToolLabels,
        skipDuplicates: true,
      });
    }

    // Seed Agent Tasks
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

      await prisma.entityLabel.createMany({
        data: agentTaskLabels,
        skipDuplicates: true,
      });
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

    await prisma.uiConfig.upsert({
      where: { name: 'sidebar-superadmin' },
      update: { value: JSON.stringify(defaultSidebarMenu), role: 'superadmin' },
      create: {
        name: 'sidebar-superadmin',
        value: JSON.stringify(defaultSidebarMenu),
        role: 'superadmin',
      },
    });
    await prisma.uiConfig.upsert({
      where: { name: 'sidebar-admin' },
      update: { value: JSON.stringify(defaultSidebarMenu), role: 'admin' },
      create: { name: 'sidebar-admin', value: JSON.stringify(defaultSidebarMenu), role: 'admin' },
    });
    await prisma.uiConfig.upsert({
      where: { name: 'sidebar-user' },
      update: { value: JSON.stringify(defaultSidebarMenu), role: 'user' },
      create: { name: 'sidebar-user', value: JSON.stringify(defaultSidebarMenu), role: 'user' },
    });

    // Seed mock socket and events
    const mockSocket = await prisma.socketConfig.upsert({
      where: { id: 'mock-socket' },
      update: {},
      create: {
        id: 'mock-socket',
        name: 'Mock Socket',
        host: 'localhost',
        port: 4001,
        isActive: true,
      },
    });
    await prisma.socketEvent.createMany({
      data: [
        { socketConfigId: mockSocket.id, type: 'user', event: 'user_joined' },
        { socketConfigId: mockSocket.id, type: 'user', event: 'user_left' },
        { socketConfigId: mockSocket.id, type: 'message', event: 'message' },
      ],
      skipDuplicates: true,
    });

    console.log('✅ AI seeding completed successfully!');

    // Summary of EntityLabel relationships created
    if (mockLabelId) {
      const totalEntityLabels = await prisma.entityLabel.count({
        where: { labelId: mockLabelId },
      });
      console.log(`🏷️ Created ${totalEntityLabels} EntityLabel relationships with 'mock' label`);

      // Show breakdown by entity type
      const labelBreakdown = await prisma.entityLabel.groupBy({
        by: ['entityType'],
        where: { labelId: mockLabelId },
        _count: { entityType: true },
      });

      console.log('📊 EntityLabel breakdown by type:');
      labelBreakdown.forEach((item) => {
        console.log(`  - ${item.entityType}: ${item._count.entityType}`);
      });
    }

    console.log('✅ Seeding completed successfully!');
  }
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
