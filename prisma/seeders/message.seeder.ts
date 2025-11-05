import { PrismaClient } from '@prisma/client';
import BaseSeeder from './base.seeder';

interface MessageCreateData {
  conversationId: string;
  sender: string;
  content: string;
  position: number;
  tokens?: number | null;
  metadata?: any | null;
}

interface MockMessage {
  sender: string;
  content: string;
  position: number;
  tokens?: number;
  metadata?: any;
}

interface MockConversation {
  title: string;
  messages?: MockMessage[];
  [key: string]: any;
}

interface CreatedConversation {
  id: string;
  title: string;
  [key: string]: any;
}

export class MessageSeeder extends BaseSeeder {
  private static _instance: MessageSeeder;

  static get instance(): MessageSeeder {
    if (!this._instance) {
      this._instance = new MessageSeeder();
    }
    return this._instance;
  }

  async run(
    prisma: PrismaClient,
    mockConversations: MockConversation[],
    createdConversations: CreatedConversation[]
  ): Promise<any[]> {
    console.log('📝 Seeding Messages...');

    try {
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
                  } as MessageCreateData,
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

      console.log(`✅ Successfully seeded ${createdMessages.length} messages`);
      return createdMessages;
    } catch (error) {
      console.error('❌ Error in MessageSeeder:', error);
      throw error;
    }
  }
}