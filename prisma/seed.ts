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

const prisma = new PrismaClient();

async function main() {
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

  // Create roles
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
          'admin_cache_delete'
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
          'admin_cache_delete'
        ].includes(p.name)).map(p => ({ id: p.id }))
      }
    }
  });
  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      permissions: {
        connect: permissionRecords.filter(p => p.name === 'view_self').map(p => ({ id: p.id }))
      }
    }
  });

  // Seed users from mock data
  console.log('👥 Seeding Users...');
  const roleMapping: Record<string, string> = {
    'superadmin': superadminRole.id,
    'admin': adminRole.id,
    'user': userRole.id
  };

  for (const user of mockUsers) {
    await prisma.user.upsert({
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
  }

  // Seed configuration settings from mock data
  console.log('⚙️ Seeding Configuration...');
  for (const config of mockConfigs) {
    await prisma.config.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config
    });
  }

  // Seed mail templates from mock data
  console.log('📧 Seeding Mail Templates...');
  for (const template of mockMailTemplates) {
    await prisma.mailTemplate.upsert({
      where: { name: template.name },
      update: {
        subject: template.subject,
        body: template.body,
        active: template.active
      },
      create: template
    });
  }

  // Seed notification templates from mock data
  console.log('🔔 Seeding Notification Templates...');
  for (const template of mockNotificationTemplates) {
    await prisma.notificationTemplate.upsert({
      where: { name: template.name },
      update: {
        title: template.title,
        body: template.body,
        active: template.active
      },
      create: template
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

  const createdSSOEntries = [];
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
        await prisma.loginHistory.create({
          data: loginHistory
        });
      }
    }
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
          await prisma.logicHistory.create({
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
        }
      } catch (error) {
        console.log(`⚠ Error creating logic history entry:`, error);
      }
    }
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

  // Seed Agent Memories
  console.log('🧠 Seeding Agent Memories...');
  
  const agentMemories = mockAgentMemories.map(memory => ({
    ...memory,
    agentId: createdAgents.find(agent => agent.name === mockAgents.find(a => a.id === memory.agentId)?.name)?.id || ''
  }));

  for (const memory of agentMemories) {
    if (memory.agentId) {
      try {
        const existingMemory = await prisma.agentMemory.findFirst({
          where: { agentId: memory.agentId, content: memory.content }
        });
        
        if (!existingMemory) {
          await prisma.agentMemory.create({
            data: memory
          });
          console.log(`✓ Created memory for agent ${memory.agentId}`);
        }
      } catch (error) {
        console.log(`⚠ Error creating memory:`, error);
      }
    }
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

  // Seed Messages with position tracking
  console.log('📝 Seeding Messages...');
  
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
            await prisma.message.create({
              data: {
                conversationId: realConv.id,
                sender: message.sender,
                content: message.content,
                position: message.position,
                tokens: message.tokens || null,
                metadata: message.metadata || null
              }
            });
            console.log(`✓ Created message ${message.position} in conversation "${mockConv.title}"`);
          }
        } catch (error) {
          console.log(`⚠ Error creating message:`, error);
        }
      }
    }
  }

  // Seed Agent Tools
  console.log('🛠️ Seeding Agent Tools...');
  
  const agentTools = mockAgentTools.map(tool => ({
    ...tool,
    agentId: createdAgents.find(agent => agent.name === mockAgents.find(a => a.id === tool.agentId)?.name)?.id || ''
  }));

  for (const tool of agentTools) {
    if (tool.agentId) {
      try {
        const existingTool = await prisma.agentTool.findFirst({
          where: { agentId: tool.agentId, name: tool.name }
        });
        
        if (!existingTool) {
          await prisma.agentTool.create({
            data: tool
          });
          console.log(`✓ Created tool ${tool.name} for agent ${tool.agentId}`);
        }
      } catch (error) {
        console.log(`⚠ Error creating tool:`, error);
      }
    }
  }

  // Seed Agent Tasks
  console.log('📋 Seeding Agent Tasks...');
  
  const agentTasks = mockAgentTasks.map((task: any) => ({
    ...task,
    agentId: createdAgents.find((agent: any) => agent.name === mockAgents.find((a: any) => a.id === task.agentId)?.name)?.id || ''
  }));

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
          console.log(`✓ Created task "${task.name}" for agent ${createdTask.agent?.name} (Status: ${task.status}, Owner: ${createdTask.agent?.user?.nickname})`);
        } else {
          console.log(`⚠ Task already exists: ${task.name} (Status: ${existingTask.status})`);
        }
      } catch (error) {
        console.log(`⚠ Error creating task:`, error);
      }
    }
  }

  console.log('✅ AI seeding completed successfully!');
  console.log('Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
