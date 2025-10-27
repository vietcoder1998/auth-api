import { prisma } from '../../src/setup';
import { CommandRepository } from '../../src/repositories/command.repository';
import { ToolRepository } from '../../src/repositories/tool.repository';
import { CommandDto, ToolDro } from '../../src/interfaces';

class ToolCommandSeeder {
  private toolRepository = new ToolRepository(prisma.tool);
  private commandRepository = new CommandRepository(prisma.command);

  async seed() {
    const tools: ToolDro = await this.toolRepository.findByLabel('mock')



        this.commandRepository.bulkCreate(coomand)
}
