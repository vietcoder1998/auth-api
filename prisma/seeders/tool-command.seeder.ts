import { ToolDto } from '../../src/interfaces';
import { CommandRepository } from '../../src/repositories/command.repository';
import { ToolRepository } from '../../src/repositories/tool.repository';
import { EntityRepository } from '../../src/repositories/entity.repository';
import { EntityMethodRepository } from '../../src/repositories/entitymethod.repository';
import { prisma } from '../../src/setup';
import { randomUUID } from 'crypto';

export class ToolCommandSeeder {
  private toolRepository = new ToolRepository(prisma.tool);
  private commandRepository = new CommandRepository(prisma.command);
  private entityRepository = new EntityRepository(prisma.entity);
  private entityMethodRepository = new EntityMethodRepository(prisma.entityMethod);
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

    // Create or find Permission entity
    let permissionEntity = await prisma.entity.findFirst({
      where: { name: 'Permission' }
    });
    if (!permissionEntity) {
      permissionEntity = await this.entityRepository.create({
        name: 'Permission',
        description: 'Permission management entity for RBAC system'
      });
      console.log('✓ Created Permission entity');
    }

    // Create entity methods for permission operations
    if (!permissionEntity) {
      console.error("❌ Failed to create Permission entity");
      return [];
    }
    
    const entityMethods = await this.createEntityMethods(permissionEntity.id);
    console.log(`✓ Created/updated ${entityMethods.length} entity methods`);
    
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

    // Associate commands with entity methods
    await this.associateCommandsWithEntityMethods(toolSeeds, entityMethods);

    console.log(`✓ Created/updated ${toolSeeds.length} tool commands`);
    return toolSeeds;
  }

  /**
   * Create entity methods for permission operations
   */
  private async createEntityMethods(entityId: string) {
    const now = new Date();
    const entityMethodsData = [
      {
        name: 'findByCategory',
        description: 'Find permissions by category',
        code: `
async function findByCategory(category: string) {
  return await this.repository.findByCategory(category);
}
        `.trim(),
        entityId,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'findByName',
        description: 'Find permission by name',
        code: `
async function findByName(name: string) {
  return await this.repository.findByName(name);
}
        `.trim(),
        entityId,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'findByMethod',
        description: 'Find permissions by HTTP method',
        code: `
async function findByMethod(method: string) {
  return await this.repository.findByMethod(method);
}
        `.trim(),
        entityId,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'create',
        description: 'Create a new permission',
        code: `
async function create(data: PermissionDto) {
  return await this.repository.create(data);
}
        `.trim(),
        entityId,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'update',
        description: 'Update an existing permission',
        code: `
async function update(id: string, data: Partial<PermissionDto>) {
  return await this.repository.update(id, data);
}
        `.trim(),
        entityId,
        createdAt: now,
        updatedAt: now,
      }
    ];

    const entityMethods = [];
    for (const methodData of entityMethodsData) {
      let entityMethod = await prisma.entityMethod.findFirst({
        where: {
          name: methodData.name,
          entityId: entityId
        }
      });

      if (!entityMethod) {
        entityMethod = await this.entityMethodRepository.create(methodData);
      } else {
        entityMethod = await this.entityMethodRepository.update(entityMethod.id, {
          description: methodData.description,
          code: methodData.code,
        });
      }
      entityMethods.push(entityMethod);
    }

    return entityMethods;
  }

  /**
   * Associate commands with appropriate entity methods
   */
  private async associateCommandsWithEntityMethods(commands: any[], entityMethods: any[]) {
    const associations = [
      {
        commandName: 'FIND_PERMISSIONS_BY_CATEGORY',
        entityMethodName: 'findByCategory'
      },
      {
        commandName: 'FIND_PERMISSION_BY_NAME',
        entityMethodName: 'findByName'
      },
      {
        commandName: 'FIND_PERMISSIONS_BY_METHOD',
        entityMethodName: 'findByMethod'
      },
      {
        commandName: 'CREATE_PERMISSION',
        entityMethodName: 'create'
      },
      {
        commandName: 'UPDATE_PERMISSION',
        entityMethodName: 'update'
      }
    ];

    for (const association of associations) {
      const command = commands.find(cmd => cmd.name === association.commandName);
      const entityMethod = entityMethods.find(method => method.name === association.entityMethodName);

      if (command && entityMethod) {
        // Create the association in the junction table using raw SQL (until migration is run)
        try {
          await prisma.$executeRaw`
            INSERT IGNORE INTO command_entity_method (id, commandId, entityMethodId, createdAt)
            VALUES (${randomUUID()}, ${command.id}, ${entityMethod.id}, NOW())
          `;
        } catch (error: any) {
          // Table might not exist yet, log a warning
          console.warn(`⚠️ Could not create association (table may not exist yet): ${error.message}`);
        }
        console.log(`✓ Associated command "${association.commandName}" with entity method "${association.entityMethodName}"`);
      }
    }
  }
}

export const toolCommandSeeder = ToolCommandSeeder.instance;