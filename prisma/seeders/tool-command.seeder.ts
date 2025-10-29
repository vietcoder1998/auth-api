import { ToolDto } from '../../src/interfaces';
import { CommandRepository } from '../../src/repositories/command.repository';
import { ToolRepository } from '../../src/repositories/tool.repository';
import { prisma } from '../../src/setup';

export class ToolCommandSeeder {
  private toolRepository = new ToolRepository(prisma.tool);
  private commandRepository = new CommandRepository(prisma.command);
  public static instance = new ToolCommandSeeder();

  async run() {
    // Find the Permission Manager tool by name
    const permissionTool = await this.toolRepository.findByName('Permission Manager');
    if (!permissionTool) {
      console.warn("⚠️ Permission Manager tool not found, skipping tool commands seeding");
      return [];
    }
    
    const tools = [permissionTool];
    console.log('🔧 Seeding Tool Commands for Permission Manager...');
    
    const now = new Date();
    const commands = tools.flatMap((tool) => [
      // CREATE Permission
      {
        name: 'CREATE_PERMISSION',
        description: 'Create a new permission',
        action: 'POST',
        enabled: true,
        toolId: tool.id,
        repository: 'permission',
        params: JSON.stringify({
          name: 'Create permission',
          route: '/api/permission',
          method: 'POST',
        }),
        exampleParams: JSON.stringify({
          name: 'user.create',
          description: 'Create a new user permission',
          category: 'user',
          route: '/api/users',
          method: 'POST',
        }),
        createdAt: now,
        updatedAt: now,
      },
      // READ Permission (Single)
      {
        name: 'GET_PERMISSION',
        description: 'Get a single permission by ID',
        action: 'GET',
        enabled: true,
        toolId: tool.id,
        repository: 'permission',
        params: JSON.stringify({
          name: 'Get permission',
          route: '/api/permission/:id',
          method: 'GET',
        }),
        exampleParams: JSON.stringify({
          id: 'permission-id-123',
        }),
        createdAt: now,
        updatedAt: now,
      },
      // READ Permissions (List)
      {
        name: 'LIST_PERMISSIONS',
        description: 'List all permissions with optional filtering',
        action: 'GET',
        enabled: true,
        toolId: tool.id,
        repository: 'permission',
        params: JSON.stringify({
          name: 'List permissions',
          route: '/api/permission',
          method: 'GET',
        }),
        exampleParams: JSON.stringify({
          category: 'user',
          method: 'POST',
        }),
        createdAt: now,
        updatedAt: now,
      },
      // UPDATE Permission
      {
        name: 'UPDATE_PERMISSION',
        description: 'Update an existing permission',
        action: 'PUT',
        enabled: true,
        toolId: tool.id,
        repository: 'permission',
        params: JSON.stringify({
          name: 'Update permission',
          route: '/api/permission/:id',
          method: 'PUT',
        }),
        exampleParams: JSON.stringify({
          id: 'permission-id-123',
          name: 'user.update',
          description: 'Updated permission description',
          category: 'user',
        }),
        createdAt: now,
        updatedAt: now,
      },
      // DELETE Permission
      {
        name: 'DELETE_PERMISSION',
        description: 'Delete a permission permanently',
        action: 'DELETE',
        enabled: true,
        toolId: tool.id,
        repository: 'permission',
        params: JSON.stringify({
          name: 'Delete permission',
          route: '/api/permission/:id',
          method: 'DELETE',
        }),
        exampleParams: JSON.stringify({
          id: 'permission-id-123',
        }),
        createdAt: now,
        updatedAt: now,
      },
      // SEARCH Permission by Name
      {
        name: 'FIND_PERMISSION_BY_NAME',
        description: 'Find permission by name',
        action: 'GET',
        enabled: true,
        toolId: tool.id,
        repository: 'permission',
        params: JSON.stringify({
          name: 'Find permission by name',
          route: '/api/permission/name/:name',
          method: 'GET',
        }),
        exampleParams: JSON.stringify({
          name: 'user.create',
        }),
        createdAt: now,
        updatedAt: now,
      },
      // SEARCH Permissions by Category
      {
        name: 'FIND_PERMISSIONS_BY_CATEGORY',
        description: 'Find permissions by category',
        action: 'GET',
        enabled: true,
        toolId: tool.id,
        repository: 'permission',
        params: JSON.stringify({
          name: 'Find permissions by category',
          route: '/api/permission/category/:category',
          method: 'GET',
        }),
        exampleParams: JSON.stringify({
          category: 'user',
        }),
        createdAt: now,
        updatedAt: now,
      },
      // SEARCH Permissions by Method
      {
        name: 'FIND_PERMISSIONS_BY_METHOD',
        description: 'Find permissions by HTTP method',
        action: 'GET',
        enabled: true,
        toolId: tool.id,
        repository: 'permission',
        params: JSON.stringify({
          name: 'Find permissions by method',
          route: '/api/permission/method/:method',
          method: 'GET',
        }),
        exampleParams: JSON.stringify({
          method: 'POST',
        }),
        createdAt: now,
        updatedAt: now,
      },
    ]);

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

export const toolCommandSeeder = ToolCommandSeeder.instance;