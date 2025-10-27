import { CommandModel, ToolDto } from '../../src/interfaces';
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
    console.log(tools);
    const commands: CommandModel[] = tools.map((tool) => {
      const now = new Date();
      return {
        id: '',
        name: 'CREATE MISSING PERMISSION',
        action: 'POST',
        enabled: true,
        toolId: tool.id,
        repository: 'permission',
        params: `{
        name: 'Create permission',
        route: '/api/permission',
        method: 'POST'
    }`,
        createdAt: now,
        updatedAt: now,
      };
    });
    const toolSeeds = await this.commandRepository.bulkCreate(commands);

    return toolSeeds;
  }
}
