/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import { mockAgents, mockAgentMemories, mockAgentTools, mockAgentTasks } from '../src/mock/agents';
import { mockConversations } from '../src/mock/conversations';
import { mockPermissions } from '../src/mock/permissions';
import { mockUsers } from '../src/mock/users';
import { mockConfigs } from '../src/mock/configs';
import { mockMailTemplates } from '../src/mock/mail-templates';
import { mockNotificationTemplates } from '../src/mock/notification-templates';
import { mockSSOEntries } from '../src/mock/sso';
import { mockLoginHistoryEntries } from '../src/mock/login-history';
import { mockLogicHistoryEntries } from '../src/mock/logic-history';
import { mockLabels } from '../src/mock/labels';

const prisma = new PrismaClient();

async function main() {
  // Seed FAQs and related messages
  console.log('❓ Seeding FAQs and FAQ Messages...');
  const { mockFaqs } = await import('../src/mock/faq');
  for (const faq of mockFaqs) {
    // Create FAQ
    const createdFaq = await prisma.faq.create({
      data: {
        question: faq.question,
        answer: faq.answer,
        type: faq.type,
        promptId: (faq as any).promptId || undefined,
        conversationId: (faq as any).conversationId || undefined,
        aiAgentId: (faq as any).aiAgentId || undefined,
        createdAt: faq.createdAt,
        updatedAt: faq.updatedAt,
      }
    });

    // Create a new conversation for FAQ messages if not mapped
    let conversationId = (faq as any).conversationId;
    if (!conversationId) {
      const conv = await prisma.conversation.create({
        data: {
          agentId: (faq as any).aiAgentId || undefined,
          userId: (faq as any).userId || undefined,
          title: `FAQ: ${faq.question}`,
          summary: faq.answer,
          isActive: true,
        }
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
        }
      });
    }
  }
  // Seed labels first (required for all other entities)
  console.log('🏷️ Seeding Labels...');
  const createdLabels: Record<string, any> = {};
  
  for (const label of mockLabels) {
    const createdLabel = await prisma.label.upsert({
      where: { name: label.name },
      update: {
        color: label.color
      },
      create: {
        name: label.name,
        color: label.color
      }
    });
    createdLabels[label.name] = createdLabel;
  }

  // Get the default mock label ID for other entities
  const mockLabelId = createdLabels['mock']?.id;

  // Seed permissions from mock data
  console.log('🔐 Seeding Permissions...');
  
  const permissionRecords = await Promise.all(
    mockPermissions.map((permission: any) => prisma.permission.upsert({
      where: { name: permission.name },
      update: {
        description: permission.description,
        category: permission.category,
        route: permission.route,
        method: permission.method
      },
      create: {
        name: permission.name,
        description: permission.description,
        category: permission.category,
        route: permission.route,
        method: permission.method
      }
    }))
  );

  // Add mock label to all permissions
  if (mockLabelId) {
    const permissionLabels = permissionRecords.map(permission => ({
      entityId: permission.id,
      entityType: 'permission',
      labelId: mockLabelId
    }));
    
    await prisma.entityLabel.createMany({
      data: permissionLabels,
      skipDuplicates: true
    });
  }

  // Create roles
  console.log('👑 Seeding Roles...');
  const superadminRole = await prisma.role.upsert({
    where: { name: 'superadmin' },
    update: {
      permissions: {
        set: permissionRecords.map(p => ({ id: p.id })) // Update to include all permissions
      }
    },
    create: {
      name: 'superadmin',
      permissions: {
        connect: permissionRecords.map(p => ({ id: p.id }))
      }
    }
  });
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {
      permissions: {
        set: permissionRecords.filter(p => [
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
          'create_logs'
        ].includes(p.name)).map(p => ({ id: p.id }))
      }
    },
    create: {
      name: 'admin',
      permissions: {
        connect: permissionRecords.filter(p => [
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
          'create_logs'
        ].includes(p.name)).map(p => ({ id: p.id }))
      }
    }
  });
  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {
      permissions: {
        set: permissionRecords.filter(p => [
          'view_self',
          'view_conversations',
          'create_conversations',
          'view_messages',
          'send_messages',
          'view_ai_agents',
          'chat_with_agents'
        ].includes(p.name)).map(p => ({ id: p.id }))
      }
    },
    create: {
      name: 'user',
      permissions: {
        connect: permissionRecords.filter(p => [
          'view_self',
          'view_conversations',
          'create_conversations',
          'view_messages',
          'send_messages',
          'view_ai_agents',
          'chat_with_agents'
        ].includes(p.name)).map(p => ({ id: p.id }))
      }
    }
  });

  // Add mock label to all roles
  if (mockLabelId) {
    const roleLabels = [
      { entityId: superadminRole.id, entityType: 'role', labelId: mockLabelId },
      { entityId: adminRole.id, entityType: 'role', labelId: mockLabelId },
      { entityId: userRole.id, entityType: 'role', labelId: mockLabelId }
    ];
    
    await prisma.entityLabel.createMany({
      data: roleLabels,
      skipDuplicates: true
    });
  }

  // Seed users from mock data
  console.log('👥 Seeding Users...');
  const roleMapping: Record<string, string> = {
    'superadmin': superadminRole.id,
    'admin': adminRole.id,
    'user': userRole.id
  };

  const createdUsers: any[] = [];
  for (const user of mockUsers) {
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        password: user.password,
        nickname: user.nickname,
        roleId: roleMapping[user.roleName],
        status: user.status
      }
    });
    createdUsers.push(createdUser);
  }

  // Add mock label to all users
  if (mockLabelId) {
    const userLabels = createdUsers.map(user => ({
      entityId: user.id,
      entityType: 'user',
      labelId: mockLabelId
    }));
    
    await prisma.entityLabel.createMany({
      data: userLabels,
      skipDuplicates: true
    });
  }

  // Seed configuration settings from mock data
  console.log('⚙️ Seeding Configuration...');
  const createdConfigs: any[] = [];
  for (const config of mockConfigs) {
    const createdConfig = await prisma.config.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config
    });
    createdConfigs.push(createdConfig);
  }

  // Add mock label to all configs
  if (mockLabelId) {
    const configLabels = createdConfigs.map(config => ({
      entityId: config.id,
      entityType: 'config',
      labelId: mockLabelId
    }));
    
    await prisma.entityLabel.createMany({
      data: configLabels,
      skipDuplicates: true
    });
  }

  // Seed mail templates from mock data
  console.log('📧 Seeding Mail Templates...');
  const createdMailTemplates: any[] = [];
  for (const template of mockMailTemplates) {
    const createdTemplate = await prisma.mailTemplate.upsert({
      where: { name: template.name },
      update: {
        subject: template.subject,
        body: template.body,
        active: template.active
      },
      create: template
    });
    createdMailTemplates.push(createdTemplate);
  }

  // Add mock label to all mail templates
  if (mockLabelId) {
    const mailTemplateLabels = createdMailTemplates.map(template => ({
      entityId: template.id,
      entityType: 'mailTemplate',
      labelId: mockLabelId
    }));
    
    await prisma.entityLabel.createMany({
      data: mailTemplateLabels,
      skipDuplicates: true
    });
  }

  // Seed notification templates from mock data
  console.log('🔔 Seeding Notification Templates...');
  const createdNotificationTemplates: any[] = [];
  for (const template of mockNotificationTemplates) {
    const createdTemplate = await prisma.notificationTemplate.upsert({
      where: { name: template.name },
      update: {
        title: template.title,
        body: template.body,
        active: template.active
      },
      create: template
    });
    createdNotificationTemplates.push(createdTemplate);
  }

  // Add mock label to all notification templates
  if (mockLabelId) {
    const notificationTemplateLabels = createdNotificationTemplates.map(template => ({
      entityId: template.id,
      entityType: 'notificationTemplate',
      labelId: mockLabelId
    }));
    
    await prisma.entityLabel.createMany({
      data: notificationTemplateLabels,
      skipDuplicates: true
    });
  }

  // Get users for SSO seeding
  const superadminUser = await prisma.user.findUnique({ where: { email: 'superadmin@example.com' } });
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
  const regularUser = await prisma.user.findUnique({ where: { email: 'user@example.com' } });

  // TODO: Uncomment SSO seeding after running 'npx prisma generate'


  // Seed SSO entries from mock data
  console.log('🔐 Seeding SSO Entries...');
  const userEmailToIdMapping: Record<string, string> = {
    'superadmin@example.com': superadminUser?.id || '',
    'admin@example.com': adminUser?.id || '',
    'user@example.com': regularUser?.id || ''
  };

  const ssoEntries = mockSSOEntries.map(sso => ({
    ...sso,
    userId: userEmailToIdMapping[sso.userEmail] || '',
    userEmail: undefined // Remove the userEmail field as it's not part of the schema
  }));

  const createdSSOEntries: any[] = [];
  for (const sso of ssoEntries) {
    if (sso.userId) {
      const createdSSO = await prisma.sSO.upsert({
        where: { key: sso.key },
        update: {
          url: sso.url,
          userId: sso.userId,
          deviceIP: sso.deviceIP,
          isActive: sso.isActive,
          expiresAt: sso.expiresAt,
          ...(sso.ssoKey && { ssoKey: sso.ssoKey }) // Add ssoKey if present
        },
        create: sso
      });
      createdSSOEntries.push(createdSSO);
    }
  }

  // Add mock label to all SSO entries
  if (mockLabelId && createdSSOEntries.length > 0) {
    const ssoLabels = createdSSOEntries.map(sso => ({
      entityId: sso.id,
      entityType: 'sso',
      labelId: mockLabelId
    }));
    
    await prisma.entityLabel.createMany({
      data: ssoLabels,
      skipDuplicates: true
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

  const loginHistoryEntries = mockLoginHistoryEntries.map(entry => ({
    userId: userEmailToIdMapping[entry.userEmail] || '',
    ssoId: entry.ssoKey ? ssoKeyToIdMapping[entry.ssoKey] || null : null,
    deviceIP: entry.deviceIP,
    userAgent: entry.userAgent,
    location: entry.location,
    status: entry.status,
    loginAt: entry.loginAt,
    logoutAt: entry.logoutAt || null
  }));

  const createdLoginHistories: any[] = [];
  for (const loginHistory of loginHistoryEntries) {
    if (loginHistory.userId) {
      // Since LoginHistory might not have unique constraints, we can use create
      // But first check if a similar entry exists to avoid duplicates
      const existingEntry = await prisma.loginHistory.findFirst({
        where: {
          userId: loginHistory.userId,
          ssoId: loginHistory.ssoId || null,
          deviceIP: loginHistory.deviceIP,
          loginAt: loginHistory.loginAt
        }
      });
      
      if (!existingEntry) {
        const createdHistory = await prisma.loginHistory.create({
          data: loginHistory
        });
        createdLoginHistories.push(createdHistory);
      } else {
        createdLoginHistories.push(existingEntry);
      }
    }
  }

  // Add mock label to all login histories
  if (mockLabelId && createdLoginHistories.length > 0) {
    const loginHistoryLabels = createdLoginHistories.map(history => ({
      entityId: history.id,
      entityType: 'loginHistory',
      labelId: mockLabelId
    }));
    
    await prisma.entityLabel.createMany({
      data: loginHistoryLabels,
      skipDuplicates: true
    });
  }

  // Seed Logic History from mock data
  console.log('📜 Seeding Logic History...');
  const logicHistoryEntries = mockLogicHistoryEntries.map(entry => ({
    userId: entry.userEmail ? userEmailToIdMapping[entry.userEmail] : null,
    action: entry.action,
    description: entry.description,
    metadata: entry.metadata,
    createdAt: entry.createdAt
  }));

  const createdLogicHistories: any[] = [];
  for (const logicHistory of logicHistoryEntries) {
    // Only create logic history for users that exist (skip null userId entries)
    if (logicHistory.userId) {
      try {
        // Check if a similar logic history entry exists to avoid duplicates
        const existingEntry = await prisma.logicHistory.findFirst({
          where: {
            userId: logicHistory.userId,
            action: logicHistory.action,
            createdAt: {
              gte: new Date(logicHistory.createdAt.getTime() - 5 * 60 * 1000), // Within 5 minutes of the mock timestamp
              lte: new Date(logicHistory.createdAt.getTime() + 5 * 60 * 1000)
            }
          }
        });
        
        if (!existingEntry) {
          const createdHistory = await prisma.logicHistory.create({
            data: {
              userId: logicHistory.userId,
              action: logicHistory.action,
              entityType: 'System', // Default entity type
              entityId: null, // No specific entity
              oldValues: null,
              newValues: JSON.stringify(logicHistory.metadata),
              ipAddress: logicHistory.metadata?.ipAddress || '127.0.0.1',
              userAgent: logicHistory.metadata?.userAgent || 'System',
              notificationTemplateId: null,
              notificationSent: false,
              createdAt: logicHistory.createdAt
            }
          });
          createdLogicHistories.push(createdHistory);
        } else {
          createdLogicHistories.push(existingEntry);
        }
      } catch (error) {
        console.log(`⚠ Error creating logic history entry:`, error);
      }
    }
  }

  // Add mock label to all logic histories
  if (mockLabelId && createdLogicHistories.length > 0) {
    const logicHistoryLabels = createdLogicHistories.map(history => ({
      entityId: history.id,
      entityType: 'logicHistory',
      labelId: mockLabelId
    }));
    
    await prisma.entityLabel.createMany({
      data: logicHistoryLabels,
      skipDuplicates: true
    });
  }

  // Seed AI Agents
  console.log('🤖 Seeding AI Agents...');
  
  // Map mock agent IDs to actual user IDs
  const agentUserMapping: Record<string, string> = {
    "super-admin-id": superadminUser?.id || '',
    "admin-id": adminUser?.id || '',
    "user-id": regularUser?.id || ''
  };

  const aiAgents = mockAgents.map(agent => ({
    ...agent,
    userId: agentUserMapping[agent.ownerId] || '',
    id: undefined, // Remove mock ID to let Prisma generate
    ownerId: undefined // Remove mock field
  }));

  const createdAgents: any[] = [];
  for (const agent of aiAgents) {
    if (agent.userId) {
      try {
        const existingAgent = await prisma.agent.findFirst({
          where: { userId: agent.userId, name: agent.name },
          include: {
            user: {
              select: { id: true, email: true, nickname: true, status: true }
            }
          }
        });
        
        if (!existingAgent) {
          const createdAgent = await prisma.agent.create({
            data: agent,
            include: {
              user: {
                select: { id: true, email: true, nickname: true, status: true }
              }
            }
          });
          createdAgents.push(createdAgent);
          console.log(`✓ Created AI agent: ${agent.name} (Owner: ${createdAgent.user?.nickname}, Status: ${agent.isActive ? 'Active' : 'Inactive'})`);
        } else {
          createdAgents.push(existingAgent);
          console.log(`⚠ Agent already exists: ${agent.name} (Owner: ${existingAgent.user?.nickname}, Status: ${existingAgent.isActive ? 'Active' : 'Inactive'})`);
        }
      } catch (error) {
        console.log(`⚠ Error creating agent ${agent.name}:`, error);
      }
    }
  }

  // Add mock label to all agents
  if (mockLabelId && createdAgents.length > 0) {
    const agentLabels = createdAgents.map(agent => ({
      entityId: agent.id,
      entityType: 'agent',
      labelId: mockLabelId
    }));
    
    await prisma.entityLabel.createMany({
      data: agentLabels,
      skipDuplicates: true
    });
  }

  // Seed Agent Memories
  console.log('🧠 Seeding Agent Memories...');
  
  const agentMemories = mockAgentMemories.map(memory => ({
    ...memory,
    agentId: createdAgents.find(agent => agent.name === mockAgents.find(a => a.id === memory.agentId)?.name)?.id || ''
  }));

  const createdAgentMemories: any[] = [];
  for (const memory of agentMemories) {
    if (memory.agentId) {
      try {
        const existingMemory = await prisma.agentMemory.findFirst({
          where: { agentId: memory.agentId, content: memory.content }
        });
        
        if (!existingMemory) {
          const createdMemory = await prisma.agentMemory.create({
            data: memory
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
    const agentMemoryLabels = createdAgentMemories.map(memory => ({
      entityId: memory.id,
      entityType: 'agentMemory',
      labelId: mockLabelId
    }));
    
    await prisma.entityLabel.createMany({
      data: agentMemoryLabels,
      skipDuplicates: true
    });
  }

  // Seed Conversations and Messages
  console.log('💬 Seeding Conversations...');
  
  // Map mock IDs to actual created agent and user IDs
  const mockToRealMapping: Record<string, string> = {
    "agent-001": createdAgents.find(a => a.name === "General Assistant")?.id || '',
    "agent-002": createdAgents.find(a => a.name === "Code Assistant")?.id || '',
    "agent-003": createdAgents.find(a => a.name === "Business Analyst")?.id || '',
    "agent-004": createdAgents.find(a => a.name === "Creative Writer")?.id || '',
    "agent-005": createdAgents.find(a => a.name === "Learning Companion")?.id || '',
    "super-admin-id": superadminUser?.id || '',
    "admin-id": adminUser?.id || '',
    "user-id": regularUser?.id || ''
  };

  const conversations = mockConversations.map(conv => ({
    agentId: mockToRealMapping[conv.agentId] || '',
    userId: mockToRealMapping[conv.userId] || '',
    title: conv.title,
    summary: conv.summary,
    isActive: conv.isActive
  }));

  const createdConversations: any[] = [];
  for (const conversation of conversations) {
    if (conversation.agentId && conversation.userId) {
      try {
        const existingConversation = await prisma.conversation.findFirst({
          where: { 
            agentId: conversation.agentId, 
            userId: conversation.userId, 
            title: conversation.title 
          },
          include: {
            user: {
              select: { id: true, email: true, nickname: true, status: true }
            },
            agent: {
              select: { id: true, name: true, description: true, model: true, isActive: true }
            }
          }
        });
        
        if (!existingConversation) {
          const createdConversation = await prisma.conversation.create({
            data: conversation,
            include: {
              user: {
                select: { id: true, email: true, nickname: true, status: true }
              },
              agent: {
                select: { id: true, name: true, description: true, model: true, isActive: true }
              }
            }
          });
          createdConversations.push(createdConversation);
          console.log(`✓ Created conversation: ${conversation.title} (User: ${createdConversation.user?.nickname}, Agent: ${createdConversation.agent?.name}, Status: ${conversation.isActive ? 'Active' : 'Inactive'})`);
        } else {
          createdConversations.push(existingConversation);
          console.log(`✓ Found existing conversation: ${conversation.title} (Status: ${existingConversation.isActive ? 'Active' : 'Inactive'})`);
        }
      } catch (error) {
        console.log(`⚠ Error creating conversation:`, error);
      }
    }
  }

  // Add mock label to all conversations
  if (mockLabelId && createdConversations.length > 0) {
    const conversationLabels = createdConversations.map(conversation => ({
      entityId: conversation.id,
      entityType: 'conversation',
      labelId: mockLabelId
    }));
    
    await prisma.entityLabel.createMany({
      data: conversationLabels,
      skipDuplicates: true
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
              position: message.position
            }
          });
          
          if (!existingMessage) {
            const createdMessage = await prisma.message.create({
              data: {
                conversationId: realConv.id,
                sender: message.sender,
                content: message.content,
                position: message.position,
                tokens: message.tokens || null,
                metadata: message.metadata || null
              }
            });
            createdMessages.push(createdMessage);
            console.log(`✓ Created message ${message.position} in conversation "${mockConv.title}"`);
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
    const messageLabels = createdMessages.map(message => ({
      entityId: message.id,
      entityType: 'message',
      labelId: mockLabelId
    }));
    
    await prisma.entityLabel.createMany({
      data: messageLabels,
      skipDuplicates: true
    });
  }

  // Seed Agent Tools
  console.log('🛠️ Seeding Agent Tools...');
  
  const agentTools = mockAgentTools.map(tool => ({
    ...tool,
    agentId: createdAgents.find(agent => agent.name === mockAgents.find(a => a.id === tool.agentId)?.name)?.id || ''
  }));

  const createdAgentTools: any[] = [];
  for (const tool of agentTools) {
    if (tool.agentId) {
      try {
        const existingTool = await prisma.agentTool.findFirst({
          where: { agentId: tool.agentId, name: tool.name }
        });
        
        if (!existingTool) {
          const createdTool = await prisma.agentTool.create({
            data: tool
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
    const agentToolLabels = createdAgentTools.map(tool => ({
      entityId: tool.id,
      entityType: 'agentTool',
      labelId: mockLabelId
    }));
    
    await prisma.entityLabel.createMany({
      data: agentToolLabels,
      skipDuplicates: true
    });
  }

  // Seed Agent Tasks
  console.log('📋 Seeding Agent Tasks...');
  
  const agentTasks = mockAgentTasks.map((task: any) => ({
    ...task,
    agentId: createdAgents.find((agent: any) => agent.name === mockAgents.find((a: any) => a.id === task.agentId)?.name)?.id || ''
  }));

  const createdAgentTasks: any[] = [];
  for (const task of agentTasks) {
    if (task.agentId) {
      try {
        const existingTask = await prisma.agentTask.findFirst({
          where: { agentId: task.agentId, name: task.name }
        });
        
        if (!existingTask) {
          const createdTask = await prisma.agentTask.create({
            data: task,
            include: {
              agent: {
                select: { 
                  name: true,
                  user: {
                    select: { nickname: true }
                  }
                }
              }
            }
          });
          createdAgentTasks.push(createdTask);
          console.log(`✓ Created task "${task.name}" for agent ${createdTask.agent?.name} (Status: ${task.status}, Owner: ${createdTask.agent?.user?.nickname})`);
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
    const agentTaskLabels = createdAgentTasks.map(task => ({
      entityId: task.id,
      entityType: 'agentTask',
      labelId: mockLabelId
    }));
    
    await prisma.entityLabel.createMany({
      data: agentTaskLabels,
      skipDuplicates: true
    });
  }

  // Seed Database Connections
  console.log('🔌 Seeding Database Connections...');
  const mockDatabaseConnections = [
    {
      name: 'Main MySQL',
      description: 'Primary MySQL database for production',
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      database: 'calendation_prod',
      username: 'root',
      password: 'password',
      isActive: true,
      ssl: false,
      timeout: 30000,
      backupEnabled: true,
      backupPath: '/backups/prod',
      createdBy: superadminUser?.id || '',
    },
    {
      name: 'Dev MySQL',
      description: 'Development MySQL database',
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      database: 'calendation_dev',
      username: 'devuser',
      password: 'devpass',
      isActive: true,
      ssl: false,
      timeout: 30000,
      backupEnabled: false,
      backupPath: null,
      createdBy: adminUser?.id || '',
    },
  ];
  const createdDatabaseConnections: any[] = [];
  for (const dbConn of mockDatabaseConnections) {
    try {
      const existingConn = await prisma.databaseConnection.findUnique({ where: { name: dbConn.name } });
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
    const dbConnLabels = createdDatabaseConnections.map(conn => ({
      entityId: conn.id,
      entityType: 'databaseConnection',
      labelId: mockLabelId
    }));
    await prisma.entityLabel.createMany({
      data: dbConnLabels,
      skipDuplicates: true
    });
  }

  // Seed UI Configs for sidebar/menu
  console.log('🖥️ Seeding UI Configs...');
  const defaultSidebarMenu = [
    {
      key: '/admin',
      icon: 'HomeOutlined',
      label: 'Dashboard',
    },
    {
      key: '/admin/system',
      icon: 'DatabaseOutlined',
      label: 'System Management',
      children: [
        { key: '/admin/system/agents', icon: 'RobotOutlined', label: 'AI Agents' },
        { key: '/admin/system/conversations', icon: 'MessageOutlined', label: 'Conversations' },
        { key: '/admin/system/documents', icon: 'FileTextOutlined', label: 'Document List' },
        { key: '/admin/system/files', icon: 'FileOutlined', label: 'File List' },
        { key: '/admin/system/users', icon: 'UserOutlined', label: 'Users' },
        { key: '/admin/system/tokens', icon: 'KeyOutlined', label: 'Tokens' },
        { key: '/admin/system/roles', icon: 'TeamOutlined', label: 'Roles' },
        { key: '/admin/system/permissions', icon: 'SafetyOutlined', label: 'Permissions' },
        { key: '/admin/system/sso', icon: 'LinkOutlined', label: 'SSO Management' },
        { key: '/admin/system/login-history', icon: 'HistoryOutlined', label: 'Login History' },
        { key: '/admin/system/logic-history', icon: 'AuditOutlined', label: 'Logic History' },
        { key: '/admin/system/logs', icon: 'AuditOutlined', label: 'Application Logs' },
        { key: '/admin/system/cache', icon: 'DatabaseOutlined', label: 'Cache' },
        { key: '/admin/system/sockets', icon: 'ThunderboltOutlined', label: 'Socket Connections' },
      ],
    },
    {
      key: '/admin/settings',
      icon: 'SettingOutlined',
      label: 'Settings Management',
      children: [
        { key: '/admin/settings/api-keys', icon: 'KeyOutlined', label: 'API Keys' },
        { key: '/admin/settings/mail', icon: 'MailOutlined', label: 'Mail Templates' },
        { key: '/admin/settings/notifications', icon: 'BellOutlined', label: 'Notifications' },
        { key: '/admin/settings/config', icon: 'SettingOutlined', label: 'Configuration' },
        { key: '/admin/settings/seed', icon: 'DatabaseOutlined', label: 'Database Seed' },
        { key: '/admin/settings/database', icon: 'DatabaseOutlined', label: 'Database Connections' },
      ],
    },
  ];

  await prisma.uiConfig.upsert({
    where: { name: 'sidebar-superadmin' },
    update: { value: JSON.stringify(defaultSidebarMenu), role: 'superadmin' },
    create: { name: 'sidebar-superadmin', value: JSON.stringify(defaultSidebarMenu), role: 'superadmin' },
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
      where: { labelId: mockLabelId }
    });
    console.log(`🏷️ Created ${totalEntityLabels} EntityLabel relationships with 'mock' label`);
    
    // Show breakdown by entity type
    const labelBreakdown = await prisma.entityLabel.groupBy({
      by: ['entityType'],
      where: { labelId: mockLabelId },
      _count: { entityType: true }
    });
    
    console.log('📊 EntityLabel breakdown by type:');
    labelBreakdown.forEach(item => {
      console.log(`  - ${item.entityType}: ${item._count.entityType}`);
    });
  }
  
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
