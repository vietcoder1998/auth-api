import { CommandDro, CommandModel, ToolDto } from '../../src/interfaces';
import { CommandRepository } from '../../src/repositories/command.repository';
import { ToolRepository } from '../../src/repositories/tool.repository';
import { prisma } from '../../src/setup';

export class ToolCommandSeeder {
  private toolRepository = new ToolRepository(prisma.tool);
  private commandRepository = new CommandRepository(prisma.command);
  public instance = new ToolCommandSeeder();

  async seed() {
    const tools: ToolDto[] | null = await this.toolRepository.findByLabel('mock')
    if (!tools) {
        throw new Error("No tools found with label 'mock'");
    }
    const commands: CommandModel[] = tools.map(tool => {
        const now = new Date();
        return {
            id: '', // Provide a default or generated id as needed
            name: 'CREATE MISSING PERMISSION', // Provide a default name
            action: 'POST', // Provide a default action
            enabled: true, // Provide a default enabled value
            toolId: tool.id,
            command: 'command1',
            repository: 'permission',
            params: `{
                name: 'Create permission',
                route: '/api/permission',
                method: 'POST'
            }`,
            createdAt: now,
            updatedAt: now,
            // Add any other required properties with default/mock values
        }
    })

    const toolSeeds =  this.commandRepository.bulkCreate(commands)

    return toolSeeds
  }
}
