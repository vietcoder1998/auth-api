import { PrismaClient } from '@prisma/client';
import BaseSeeder from './base.seeder';

interface ConversationCreateData {
  agentId: string;
  userId: string;
  title: string;
  summary?: string;
  isActive: boolean;
}

interface MockConversation {
  agentId: string;
  userId: string;
  title: string;
  summary?: string;
  isActive: boolean;
  messages?: any[];
}

interface CreatedAgent {
  id: string;
  name: string;
  [key: string]: any;
}

interface User {
  id: string;
  [key: string]: any;
}

export class ConversationSeeder extends BaseSeeder {
  private static _instance: ConversationSeeder;

  static get instance(): ConversationSeeder {
    if (!this._instance) {
      this._instance = new ConversationSeeder();
    }
    return this._instance;
  }

  async run(
    prisma: PrismaClient,
    mockConversations: MockConversation[],
    createdAgents: CreatedAgent[],
    superadminUser: User | null,
    adminUser: User | null,
    regularUser: User | null
  ): Promise<any[]> {
    console.log('💬 Seeding Conversations...');

    try {
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

      console.log(`✅ Successfully seeded ${createdConversations.length} conversations`);
      return createdConversations;
    } catch (error) {
      console.error('❌ Error in ConversationSeeder:', error);
      throw error;
    }
  }
}