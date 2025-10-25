/**
 * FAQs Seeder
 * Handles seeding of FAQ entries
 */

import { PrismaClient } from '@prisma/client';
import { FaqRepository } from '../../src/repositories/faq.repository';

export class FaqsSeeder {
  private faqRepo: FaqRepository;

  constructor(prisma: PrismaClient) {
    this.faqRepo = new FaqRepository(prisma);
  }

  /**
   * Seed FAQ data
   */
  async seed(): Promise<void> {
    console.log('❓ Seeding FAQs...');
    await this.seedFAQs();
  }

  /**
   * Create FAQ entries
   * Uses batch upsert for performance
   */
  private async seedFAQs(): Promise<void> {
    const { mockFAQs } = await import('../mock/faqs.mock');
    
    // Prepare FAQ data for batch upsert
    const faqData = mockFAQs.map(faq => ({
      where: { question: faq.question },
      data: faq,
    }));

    // Batch upsert for performance
    const upsertPromises = faqData.map(({ where, data }) =>
      this.faqRepo.upsert({
        where,
        create: data,
        update: data,
      })
    );

    const results = await Promise.all(upsertPromises);
    console.log(`  ✓ Upserted ${results.length} FAQs`);

    // Log categories created
    const categories = [...new Set(mockFAQs.map(faq => faq.category))];
    console.log(`  ℹ️  Categories: ${categories.join(', ')}`);
  }

  /**
   * Get FAQs by category
   */
  async getFAQsByCategory(category: string): Promise<any[]> {
    return this.faqRepo.findMany({
      where: { category },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Get published FAQs
   */
  async getPublishedFAQs(): Promise<any[]> {
    return this.faqRepo.findMany({
      where: { isPublished: true },
      orderBy: { order: 'asc' },
    });
  }
}
