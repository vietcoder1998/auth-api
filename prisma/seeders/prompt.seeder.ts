import { PrismaClient } from '@prisma/client';
import BaseSeeder from './base.seeder';

interface PromptCreateData {
  conversationId: string;
  prompt: string;
  createdAt: Date;
}

interface MockPrompt {
  conversationId?: string;
  prompt: string;
  createdAt: Date;
}

export class PromptSeeder extends BaseSeeder {
  private static _instance: PromptSeeder;

  static get instance(): PromptSeeder {
    if (!this._instance) {
      this._instance = new PromptSeeder();
    }
    return this._instance;
  }

  async run(prisma: PrismaClient, mockPrompts: MockPrompt[]): Promise<void> {
    console.log('💡 Seeding Prompts...');

    try {
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
          } as PromptCreateData;
        }),
      );

      // Filter out invalid prompts and batch create
      const validPrompts = promptValidationResults.filter((p) => p !== null) as PromptCreateData[];
      
      if (validPrompts.length > 0) {
        try {
          await prisma.promptHistory.createMany({
            data: validPrompts,
            skipDuplicates: true,
          });
          console.log(`✓ Created ${validPrompts.length} prompts`);
        } catch (error) {
          console.log(`⚠ Error creating prompts:`, error);
          throw error;
        }
      } else {
        console.log('⚠ No valid prompts to create');
      }
    } catch (error) {
      console.error('❌ Error in PromptSeeder:', error);
      throw error;
    }
  }
}