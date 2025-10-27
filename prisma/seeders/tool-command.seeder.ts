import { ToolDto } from '../../src/interfaces';
import { CommandRepository } from '../../src/repositories/command.repository';
import { ToolRepository } from '../../src/repositories/tool.repository';
import { prisma } from '../../src/setup';

export class ToolCommandSeeder {
  private toolRepository = new ToolRepository(prisma.tool);
  private commandRepository = new CommandRepository(prisma.command);
  public static instance = new ToolCommandSeeder();

  async run() {
    const tools: ToolDto[] | null = await this.toolRepository.findByLabel('mock', 'tool');
    if (!tools) {
      throw new Error("No tools found with label 'mock'");
    }
    console.log('🔧 Seeding Tool Commands...');
    
    const commands = tools.map((tool) => {
      const now = new Date();
      return {
        name: 'CREATE_MISSING_PERMISSION',
        action: 'POST',
        enabled: true,
        toolId: tool.id,
        repository: 'permission',
        params: JSON.stringify({
          name: 'Create permission',
          route: '/api/permission',
          method: 'POST',
          example: {
            permission: 'user.create',
            description: 'Create a new user permission',
            category: 'user',
          },
        }),
        createdAt: now,
        updatedAt: now,
      };
    });

    // Use seed method instead of bulkCreate to handle duplicates properly
    const toolSeeds = await this.commandRepository.seed(
      commands.map((command) => ({
        where: { 
          toolId_name: {
            toolId: command.toolId,
            name: command.name
          }
        },
        create: command,
        update: {
          action: command.action,
          enabled: command.enabled,
          repository: command.repository,
          params: command.params,
        },
      }))
    );

    console.log(`✓ Created/updated ${toolSeeds.length} tool commands`);
    return toolSeeds;
  }
}
