import { PrismaClient } from '@prisma/client';
import { FaqRepository } from '../../src/repositories/faq.repository';

/**
 * FAQs Seeder
 * Handles seeding of FAQ entries
 */

export class FaqsSeeder {
  private faqRepo: FaqRepository;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.faqRepo = new FaqRepository(prisma.faq);
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
    
    // Batch upsert for performance
    const upsertPromises = mockFAQs.map(faq =>
      this.faqRepo.upsert(
        { question: faq.question },
        faq,
        faq
      )
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
    return this.faqRepo.search({
      where: { category },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Get published FAQs
   */
  async getPublishedFAQs(): Promise<any[]> {
    return this.faqRepo.search({
      where: { isPublished: true },
      orderBy: { order: 'asc' },
    });
  }
}
