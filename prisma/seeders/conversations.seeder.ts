/**
 * Conversations Seeder
 * Handles seeding of conversations and messages
 */

import { PrismaClient } from '@prisma/client';
import { ConversationRepository } from '../../src/repositories/conversation.repository';
import { MessageRepository } from '../../src/repositories/message.repository';

export class ConversationsSeeder {
  private conversationRepo: ConversationRepository;
  private messageRepo: MessageRepository;
  private userMapping: Record<string, any>;
  private agentMapping: Record<string, any[]>;
  private createdConversations: any[] = [];

  constructor(
    prisma: PrismaClient,
    userMapping: Record<string, any>,
    agentMapping: Record<string, any[]>
  ) {
    this.conversationRepo = new ConversationRepository(prisma);
    this.messageRepo = new MessageRepository(prisma);
    this.userMapping = userMapping;
    this.agentMapping = agentMapping;
  }

  /**
   * Seed all conversation-related data
   */
  async seed(): Promise<void> {
    console.log('🗨️  Seeding conversations...');
    await this.seedConversations();
    await this.seedMessages();
  }

  /**
   * Create conversations for users with agents
   */
  private async seedConversations(): Promise<void> {
    const { mockConversations } = await import('../mock/conversations.mock');
    
    // Get first available user and their agents
    const userEmails = Object.keys(this.userMapping);
    if (userEmails.length === 0) {
      console.log('  ⚠️  No users found, skipping conversations');
      return;
    }

    const firstUser = this.userMapping[userEmails[0]];
    const userAgents = this.agentMapping[firstUser.id] || [];

    if (userAgents.length === 0) {
      console.log('  ⚠️  No agents found for user, skipping conversations');
      return;
    }

    // Create conversations for each mock data entry
    const conversationPromises = mockConversations.map(async (conv, index) => {
      const agent = userAgents[index % userAgents.length];
      
      return this.conversationRepo.create({
        ...conv,
        userId: firstUser.id,
        agentId: agent.id,
      });
    });

    this.createdConversations = await Promise.all(conversationPromises);
    console.log(`  ✓ Created ${this.createdConversations.length} conversations`);
  }

  /**
   * Create messages for conversations
   */
  private async seedMessages(): Promise<void> {
    if (this.createdConversations.length === 0) {
      console.log('  ⚠️  No conversations found, skipping messages');
      return;
    }

    const { mockMessages } = await import('../mock/conversations.mock');
    
    // Create messages for each conversation
    const messagePromises: Promise<any>[] = [];

    for (const conversation of this.createdConversations) {
      // Add all mock messages to this conversation
      for (const message of mockMessages) {
        messagePromises.push(
          this.messageRepo.create({
            ...message,
            conversationId: conversation.id,
            userId: conversation.userId,
          })
        );
      }
    }

    const createdMessages = await Promise.all(messagePromises);
    console.log(`  ✓ Created ${createdMessages.length} messages across ${this.createdConversations.length} conversations`);
  }

  /**
   * Get created conversations for use in other seeders
   */
  getCreatedConversations(): any[] {
    return this.createdConversations;
  }
}
