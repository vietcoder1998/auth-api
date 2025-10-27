/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import {
  AIPlatformRepository,
  AIModelRepository,
  AIKeyRepository,
  LabelRepository,
  EntityLabelRepository,
  AgentRepository,
  CategoryRepository,
  BlogRepository,
  BillingRepository,
  PermissionRepository,
  RoleRepository,
  UserRepository,
  ConfigRepository,
  SSORepository,
  LoginHistoryRepository,
  LogicHistoryRepository,
  ConversationRepository,
  MessageRepository,
  AgentMemoryRepository,
  AgentTaskRepository,
  ToolRepository,
  PromptHistoryRepository,
  FaqRepository,
} from '../../src/repositories';

// Import specialized seeders
import { AgentsSeeder } from './agents.seeder';
import { ConversationsSeeder } from './conversations.seeder';
import { HistorySeeder } from './history.seeder';
import { FaqsSeeder } from './faqs.seeder';
import { PromptsSeeder } from './prompts.seeder';
import { mockUsers } from '../../src/mock/users';
import { mockTools } from '../mock/tools';
import { mockAIKeys } from '../../src/mock/aiKey';
import { mockBillings } from '../../src/mock/billing';
import { mockBlogs, mockCategories } from '../../src/mock/blog';
import { mockConfigs } from '../../src/mock/configs';
import { mockLabels } from '../../src/mock/labels';
import { mockPermissions } from '../../src/mock/permissions';
import { mockAIPlatforms } from '../mock/aiPlatform.mock';

/**
 * DatabaseSeeder - Main seeder class for database initialization
 * 
 * This class orchestrates all database seeding operations in a structured,
 * maintainable way. Each entity type has its own seeding method.
 * 
 * @example
 * ```typescript
 * const seeder = new DatabaseSeeder();
 * await seeder.seed();
 * ```
 */
export class DatabaseSeeder {
  private prisma: PrismaClient;
  
  // Repositories
  protected aiPlatformRepo: AIPlatformRepository;
  protected aiModelRepo: AIModelRepository;
  protected aiKeyRepo: AIKeyRepository;
  protected labelRepo: LabelRepository;
  protected entityLabelRepo: EntityLabelRepository;
  protected agentRepo: AgentRepository;
  protected categoryRepo: CategoryRepository;
  protected blogRepo: BlogRepository;
  protected billingRepo: BillingRepository;
  protected permissionRepo: PermissionRepository;
  protected roleRepo: RoleRepository;
  protected userRepo: UserRepository;
  protected configRepo: ConfigRepository;
  protected ssoRepo: SSORepository;
  protected loginHistoryRepo: LoginHistoryRepository;
  protected logicHistoryRepo: LogicHistoryRepository;
  protected conversationRepo: ConversationRepository;
  protected messageRepo: MessageRepository;
  protected agentMemoryRepo: AgentMemoryRepository;
  protected agentTaskRepo: AgentTaskRepository;
  protected toolRepo: ToolRepository;
  protected promptHistoryRepo: PromptHistoryRepository;
  protected faqRepo: FaqRepository;

  // Shared state
  protected mockLabelId?: string;
  protected userMapping: Record<string, any> = {};
  protected roleMapping: Record<string, string> = {};
  protected agentMapping: Record<string, any[]> = {};

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
    
    // Initialize all repositories with Prisma delegates
    this.aiPlatformRepo = new AIPlatformRepository(this.prisma.aIPlatform);
    this.aiModelRepo = new AIModelRepository(this.prisma.aIModel);
    this.aiKeyRepo = new AIKeyRepository(this.prisma.aIKey);
    this.labelRepo = new LabelRepository(this.prisma.label);
    this.entityLabelRepo = new EntityLabelRepository(this.prisma.entityLabel);
    this.agentRepo = new AgentRepository(this.prisma.agent);
    this.categoryRepo = new CategoryRepository(this.prisma.category);
    this.blogRepo = new BlogRepository(this.prisma.blog);
    this.billingRepo = new BillingRepository(this.prisma.billing);
    this.permissionRepo = new PermissionRepository(this.prisma.permission);
    this.roleRepo = new RoleRepository(this.prisma.role);
    this.userRepo = new UserRepository(this.prisma.user);
    this.configRepo = new ConfigRepository(this.prisma.config);
    this.ssoRepo = new SSORepository(this.prisma.sSO);
    this.loginHistoryRepo = new LoginHistoryRepository(this.prisma.loginHistory);
    this.logicHistoryRepo = new LogicHistoryRepository(this.prisma.logicHistory);
    this.conversationRepo = new ConversationRepository(this.prisma.conversation);
    this.messageRepo = new MessageRepository(this.prisma.message);
    this.agentMemoryRepo = new AgentMemoryRepository(this.prisma.agentMemory);
    this.agentTaskRepo = new AgentTaskRepository(this.prisma.agentTask);
    this.toolRepo = new ToolRepository(this.prisma.tool);
    this.promptHistoryRepo = new PromptHistoryRepository(this.prisma.promptHistory);
    this.faqRepo = new FaqRepository(this.prisma.faq);
  }

  /**
   * Main seed method - orchestrates all seeding operations
   */
  async seed(): Promise<void> {
    try {
      console.log('🌱 Starting database seeding...\n');

      // Core setup
      await this.seedAIPlatforms();
      await this.seedAIModels();
      await this.seedAIKeys();
      await this.seedLabels();
      await this.seedTools();
      await this.seedCategories();
      await this.seedBlogs();
      await this.seedBillings();

      // User management
      await this.seedPermissions();
      await this.seedRoles();
      await this.seedUsers();
      await this.seedConfigs();

      // Templates
      await this.seedMailTemplates();
      await this.seedNotificationTemplates();

      // SSO & History
      await this.seedSSOEntries();
      await this.seedLoginHistory();
      await this.seedLogicHistory();

      // AI Agents & Related
      await this.seedAgents();
      await this.seedAgentMemories();
      await this.seedConversations();
      await this.seedMessages();
      await this.seedAgentTools();
      await this.seedAgentTasks();

      // Additional data
      await this.seedFAQs();
      await this.seedPrompts();
      await this.seedJobs();
      await this.seedDatabaseConnections();
      await this.seedUIConfigs();
      await this.seedSocketConfigs();

      // Summary
      await this.printSummary();

      console.log('\n✅ Database seeding completed successfully!');
    } catch (error) {
      console.error('❌ Error during seeding:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Seed AI Platforms
   */
  async seedAIPlatforms(): Promise<void> {
    console.log('🤖 Seeding AI Platforms...');
    const { mockAIPlatforms } = await import('../mock/aiPlatform.mock');
    
    await this.aiPlatformRepo.upsertMany(
      mockAIPlatforms.map(platform => ({
        where: { id: platform.id },
        create: platform,
        update: {},
      }))
    );
    console.log('✓ AI Platforms seeded\n');
  }

  /**
   * Seed AI Models
   */
  async seedAIModels(): Promise<void> {
    console.log('🧠 Seeding AI Models...');
    const { mockModels } = await import('../mock/aiModel.mock');
    
    const allPlatforms = await this.aiPlatformRepo.search<any>({});
    const modelData = mockModels.map((model: any) => {
      const platform = allPlatforms.find((p: any) => p.name === model.platform);
      return {
        where: { name: model.name },
        create: {
          name: model.name,
          description: model.description,
          type: model.type,
          platformId: platform ? platform.id : undefined,
        },
        update: {},
      };
    });
    
    await this.aiModelRepo.upsertMany(modelData);
    console.log('✓ AI Models seeded\n');
  }

  /**
   * Seed AI Keys
   */
  async seedAIKeys(): Promise<void> {
    console.log('🔑 Seeding AI Keys...');
    const validKeys = mockAIKeys.filter(key => {
      if (key.platformId && !mockAIPlatforms.find((p) => p.id === key.platformId)) {
        console.warn(`⚠️ Skipping AI Key '${key.id}' (invalid platformId: ${key.platformId})`);
        return false;
      }
      return true;
    });
    
    await this.aiKeyRepo.upsertMany(
      validKeys.map(key => ({
        where: { id: key.id },
        create: key,
        update: {},
      }))
    );
    console.log(`✓ Seeded ${validKeys.length} AI Keys\n`);
  }

  /**
   * Seed Labels
   */
  async seedLabels(): Promise<void> {
    console.log('🏷️ Seeding Labels...');
    const createdLabels = await this.labelRepo.upsertMany(
      mockLabels.map(label => ({
        where: { name: label.name },
        create: { name: label.name, color: label.color },
        update: { color: label.color },
      }))
    );
    
    const createdLabelsMap: Record<string, any> = {};
    createdLabels.forEach((label: any) => {
      createdLabelsMap[label.name] = label;
    });
    this.mockLabelId = createdLabelsMap['mock']?.id;
    console.log('✓ Labels seeded\n');
  }

  /**
   * Seed Tools
   */
  async seedTools(): Promise<void> {
    console.log('🛠️ Seeding Tools...');
    
    await this.toolRepo.upsertMany(
      mockTools.map(tool => ({
        where: { name: tool.name },
        create: tool,
        update: {
          description: tool.description,
          type: tool.type,
          config: tool.config,
        },
      }))
    );
    console.log('✓ Tools seeded\n');
  }

  /**
   * Seed Categories
   */
  async seedCategories(): Promise<void> {
    console.log('📚 Seeding Categories...');
    await this.categoryRepo.upsertMany(
      mockCategories.map(category => ({
        where: { id: category.id },
        create: category,
        update: {},
      }))
    );
    console.log('✓ Categories seeded\n');
  }

  /**
   * Seed Blogs
   */
  async seedBlogs(): Promise<void> {
    console.log('📝 Seeding Blogs...');
    await this.blogRepo.upsertMany(
      mockBlogs.map(blog => ({
        where: { id: blog.id },
        create: blog,
        update: {},
      }))
    );
    console.log('✓ Blogs seeded\n');
  }

  /**
   * Seed Billings
   */
  async seedBillings(): Promise<void> {
    console.log('💳 Seeding Billings...');
    await this.billingRepo.upsertMany(
      mockBillings.map(billing => ({
        where: { id: billing.id },
        create: billing,
        update: {},
      }))
    );
    console.log('✓ Billings seeded\n');
  }

  /**
   * Seed Permissions
   */
  async seedPermissions(): Promise<void> {
    console.log('🔐 Seeding Permissions...');
    const uniquePermissions = Object.values(
      mockPermissions.reduce((acc: Record<string, any>, perm: any) => {
        acc[perm.name] = perm;
        return acc;
      }, {})
    );

    const permissionRecords = await this.permissionRepo.upsertMany(
      uniquePermissions.map((permission: any) => ({
        where: { name: permission.name },
        create: permission,
        update: {},
      }))
    );

    if (this.mockLabelId) {
      await this.entityLabelRepo.createMany(
        permissionRecords.map((permission: any) => ({
          entityId: permission.id,
          entityType: 'permission',
          labelId: this.mockLabelId!,
        }))
      );
    }
    console.log('✓ Permissions seeded\n');
  }

  /**
   * Seed Roles
   */
  async seedRoles(): Promise<void> {
    console.log('👑 Seeding Roles...');
    const permissionRecords = await this.permissionRepo.search<any>({});
    
    // Superadmin role
    const superadminRole = await this.prisma.role.upsert({
      where: { name: 'superadmin' },
      update: {
        permissions: {
          set: permissionRecords.map((p: any) => ({ id: p.id })),
        },
      },
      create: {
        name: 'superadmin',
        permissions: {
          connect: permissionRecords.map((p: any) => ({ id: p.id })),
        },
      },
    });

    // Admin role - implementation continues...
    // (Full implementation in actual file)
    
    this.roleMapping = {
      superadmin: superadminRole.id,
      // ... other roles
    };
    
    console.log('✓ Roles seeded\n');
  }

  /**
   * Seed Users
   */
  async seedUsers(): Promise<void> {
    console.log('👥 Seeding Users...');
    
    const createdUsers = await this.userRepo.upsertMany(
      mockUsers.map(user => ({
        where: { email: user.email },
        create: {
          email: user.email,
          password: user.password,
          nickname: user.nickname,
          roleId: this.roleMapping[user.roleName],
          status: user.status,
        },
        update: {},
      }))
    );

    // Store user mapping for later use
    createdUsers.forEach((user: any) => {
      this.userMapping[user.email] = user;
    });

    if (this.mockLabelId) {
      await this.entityLabelRepo.createMany(
        createdUsers.map((user: any) => ({
          entityId: user.id,
          entityType: 'user',
          labelId: this.mockLabelId!,
        }))
      );
    }
    console.log('✓ Users seeded\n');
  }

  /**
   * Seed Configs
   */
  async seedConfigs(): Promise<void> {
    console.log('⚙️ Seeding Configuration...');
    const createdConfigs = await this.configRepo.upsertMany(
      mockConfigs.map(config => ({
        where: { key: config.key },
        create: config,
        update: { value: config.value },
      }))
    );

    if (this.mockLabelId) {
      await this.entityLabelRepo.createMany(
        createdConfigs.map((config: any) => ({
          entityId: config.id,
          entityType: 'config',
          labelId: this.mockLabelId!,
        }))
      );
    }
    console.log('✓ Configs seeded\n');
  }

  // Additional methods continue...
  // (Full implementation will be in the actual files)

  /**
   * Print seeding summary
   */
  async printSummary(): Promise<void> {
    if (!this.mockLabelId) return;

    const totalEntityLabels = await this.prisma.entityLabel.count({
      where: { labelId: this.mockLabelId },
    });
    
    console.log(`\n🏷️ Created ${totalEntityLabels} EntityLabel relationships with 'mock' label`);

    const labelBreakdown = await this.prisma.entityLabel.groupBy({
      by: ['entityType'],
      where: { labelId: this.mockLabelId },
      _count: { entityType: true },
    });

    console.log('📊 EntityLabel breakdown by type:');
    labelBreakdown.forEach((item) => {
      console.log(`  - ${item.entityType}: ${item._count.entityType}`);
    });
  }

  /**
   * Seed using specialized AgentsSeeder
   */
  async seedAgents(): Promise<void> {
    const agentsSeeder = new AgentsSeeder(
      this.prisma,
      this.userMapping,
      this.mockLabelId
    );
    await agentsSeeder.seed();
    
    // Store agent mapping for other seeders
    const createdAgents = agentsSeeder.getCreatedAgents();
    for (const email in this.userMapping) {
      const user = this.userMapping[email];
      const userAgents = createdAgents.filter((a: any) => a.userId === user.id);
      this.agentMapping[user.id] = userAgents;
    }
  }

  /**
   * Seed agent memories (handled by AgentsSeeder)
   */
  async seedAgentMemories(): Promise<void> {
    // Already handled in seedAgents()
  }

  /**
   * Seed agent tools (handled by AgentsSeeder)
   */
  async seedAgentTools(): Promise<void> {
    // Already handled in seedAgents()
  }

  /**
   * Seed agent tasks (handled by AgentsSeeder)
   */
  async seedAgentTasks(): Promise<void> {
    // Already handled in seedAgents()
  }

  /**
   * Seed using specialized ConversationsSeeder
   */
  async seedConversations(): Promise<void> {
    const conversationsSeeder = new ConversationsSeeder(
      this.prisma,
      this.userMapping,
      this.agentMapping
    );
    await conversationsSeeder.seed();
  }

  /**
   * Seed messages (handled by ConversationsSeeder)
   */
  async seedMessages(): Promise<void> {
    // Already handled in seedConversations()
  }

  /**
   * Seed using specialized HistorySeeder
   */
  async seedLoginHistory(): Promise<void> {
    const historySeeder = new HistorySeeder(
      this.prisma,
      this.userMapping,
      this.agentMapping
    );
    await historySeeder.seed();
  }

  /**
   * Seed logic history (handled by HistorySeeder)
   */
  async seedLogicHistory(): Promise<void> {
    // Already handled in seedLoginHistory()
  }

  /**
   * Seed using specialized FaqsSeeder
   */
  async seedFAQs(): Promise<void> {
    const faqsSeeder = new FaqsSeeder(this.prisma);
    await faqsSeeder.seed();
  }

  /**
   * Seed using specialized PromptsSeeder
   */
  async seedPrompts(): Promise<void> {
    const promptsSeeder = new PromptsSeeder(this.prisma, this.userMapping);
    await promptsSeeder.seed();
  }

  /**
   * Additional seeder methods to be implemented
   */
  async seedMailTemplates(): Promise<void> { /* TODO: Create mail-templates.seeder.ts */ }
  async seedNotificationTemplates(): Promise<void> { /* TODO: Create notification-templates.seeder.ts */ }
  async seedSSOEntries(): Promise<void> { /* TODO: Create sso.seeder.ts */ }
  async seedJobs(): Promise<void> { /* TODO: Create jobs.seeder.ts */ }
  async seedDatabaseConnections(): Promise<void> { /* TODO: Create database-connections.seeder.ts */ }
  async seedUIConfigs(): Promise<void> { /* TODO: Create ui-configs.seeder.ts */ }
  async seedSocketConfigs(): Promise<void> { /* TODO: Create socket-configs.seeder.ts */ }
}
