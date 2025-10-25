import { PrismaClient } from '@prisma/client';
import { PromptTemplateRepository } from '../../src/repositories/prompttemplate.repository';

/**
 * Prompts Seeder
 * Handles seeding of prompt templates
 */

export class PromptsSeeder {
  private promptRepo: PromptTemplateRepository;
  private userMapping: Record<string, any>;

  constructor(prisma: PrismaClient, userMapping: Record<string, any>) {
    this.promptRepo = new PromptTemplateRepository(prisma.promptTemplate);
    this.userMapping = userMapping;
  }

  /**
   * Seed prompt templates
   */
  async seed(): Promise<void> {
    console.log('📝 Seeding prompts...');
    await this.seedPrompts();
  }

  /**
   * Create prompt templates
   * Uses batch operations with duplicate checking
   */
  private async seedPrompts(): Promise<void> {
    const { mockPrompts } = await import('../mock/prompts.mock');
    
    const userEmails = Object.keys(this.userMapping);
    if (userEmails.length === 0) {
      console.log('  ⚠️  No users found, skipping prompts');
      return;
    }

    const firstUser = this.userMapping[userEmails[0]];

    // Prepare prompt data
    const promptData = mockPrompts.map(prompt => ({
      ...prompt,
      userId: firstUser.id,
    }));

    // Check for duplicates in parallel
    const uniquePrompts = await this.filterDuplicatePrompts(promptData);
    
    if (uniquePrompts.length > 0) {
      await this.promptRepo.createMany(uniquePrompts);
      console.log(`  ✓ Created ${uniquePrompts.length} prompts`);

      // Log categories
      const categories = [...new Set(uniquePrompts.map(p => p.category))];
      console.log(`  ℹ️  Categories: ${categories.join(', ')}`);
      
      // Log public vs private
      const publicCount = uniquePrompts.filter(p => p.isPublic).length;
      const privateCount = uniquePrompts.length - publicCount;
      console.log(`  ℹ️  Public: ${publicCount}, Private: ${privateCount}`);
    } else {
      console.log(`  ⚠️  All prompts already exist`);
    }
  }

  /**
   * Filter out duplicate prompts
   */
  private async filterDuplicatePrompts(prompts: any[]): Promise<any[]> {
    const checkPromises = prompts.map(prompt =>
      this.promptRepo.search({
        where: {
          name: prompt.name,
          userId: prompt.userId,
        },
        take: 1,
      })
    );

    const existingPrompts = await Promise.all(checkPromises);
    return prompts.filter((_, index) => !existingPrompts[index] || existingPrompts[index].length === 0);
  }

  /**
   * Get prompts by category
   */
  async getPromptsByCategory(category: string): Promise<any[]> {
    return this.promptRepo.search({
      where: { category },
    });
  }

  /**
   * Get public prompts
   */
  async getPublicPrompts(): Promise<any[]> {
    return this.promptRepo.search({
      where: { isPublic: true },
    });
  }
}
