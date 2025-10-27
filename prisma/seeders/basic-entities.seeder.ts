import { 
  ToolRepository,
  CategoryRepository,
  BlogRepository,
  BillingRepository
} from '../../src/repositories';
import { prisma } from '../../src/setup';

export class BasicEntitiesSeeder {
  private toolRepo = new ToolRepository(prisma.tool);
  private categoryRepo = new CategoryRepository(prisma.category);
  private blogRepo = new BlogRepository(prisma.blog);
  private billingRepo = new BillingRepository(prisma.billing);
  
  public static instance = new BasicEntitiesSeeder();

  async run({ mockTools, mockCategories, mockBlogs, mockBillings }: any) {
    // Seed Tools (global tools)
    console.log('🛠️ Seeding Tools...');
    await this.toolRepo.seed(
      mockTools.map((tool: any) => ({
        where: { name: tool.name },
        create: tool,
        update: {
          description: tool.description,
          type: tool.type,
          config: tool.config,
          enabled: tool.enabled,
        },
      })),
    );

    // Seed Categories
    console.log('📚 Seeding Categories...');
    await this.categoryRepo.seed(
      mockCategories.map((category: any) => ({
        where: { id: category.id },
        create: category,
        update: {},
      })),
    );

    // Seed Blogs
    console.log('📝 Seeding Blogs...');
    await this.blogRepo.seed(
      mockBlogs.map((blog: any) => ({
        where: { id: blog.id },
        create: blog,
        update: {},
      })),
    );

    // Seed Billings
    console.log('💳 Seeding Billings...');
    await this.billingRepo.seed(
      mockBillings.map((billing: any) => ({
        where: { id: billing.id },
        create: billing,
        update: {},
      })),
    );

    console.log('✅ Basic entities seeding completed');
  }
}