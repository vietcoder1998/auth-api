import { 
  AIKeyRepository,
  AIModelRepository, 
  AIPlatformRepository,
  LabelRepository
} from '../../src/repositories';
import { prisma } from '../../src/setup';

export class CoreEntitiesSeeder {
  private aiPlatformRepo = new AIPlatformRepository(prisma.aIPlatform);
  private aiModelRepo = new AIModelRepository();
  private aiKeyRepo = new AIKeyRepository(prisma.aIKey);
  private labelRepo = new LabelRepository(prisma.label);
  
  public static instance = new CoreEntitiesSeeder();

  async run({ mockAIPlatforms, mockModels, mockAIKeys, mockLabels }: any) {
    // Seed Labels FIRST (needed by other entities)
    console.log('🏷️ Seeding Labels...');
    const createdLabels = await this.labelRepo.seed(
      mockLabels.map((label: any) => ({
        where: { name: label.name },
        create: { name: label.name, color: label.color },
        update: { color: label.color },
      })),
    );

    // Seed AI Platforms
    console.log('🌐 Seeding AI Platforms...');
    await this.aiPlatformRepo.seed(
      mockAIPlatforms.map((platform: any) => ({
        where: { id: platform.id },
        create: platform,
        update: {},
      })),
    );

    // Seed AI Models
    console.log('🤖 Seeding AI Models...');
    await this.aiModelRepo.seed(
      mockModels.map((model: any) => ({
        where: { name: model.name },
        create: model,
        update: {
          description: model.description,
          type: model.type,
          platformId: model.platformId,
        },
      })),
    );

    // Seed AI Keys
    console.log('🔑 Seeding AI Keys...');
    const validKeys = mockAIKeys.filter((key: any) => {
      if (key.platformId && !mockAIPlatforms.find((p: any) => p.id === key.platformId)) {
        console.warn(`⚠️ Skipping AI Key '${key.id}' (invalid platformId: ${key.platformId})`);
        return false;
      }
      return true;
    });
    await this.aiKeyRepo.seed(
      validKeys.map((key: any) => ({
        where: { id: key.id },
        create: key,
        update: {},
      })),
    );

    return { createdLabels };
  }
}