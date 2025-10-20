import { PrismaClient } from '@prisma/client';
import { mockPermissions, mockRoles } from '../mock/permissions';

const prisma = new PrismaClient();

export interface SeedResult {
  success: boolean;
  message: string;
  data?: {
    users?: number;
    roles?: number;
    permissions?: number;
    configs?: number;
    agents?: number;
    apiKeys?: number;
    conversations?: number;
    messages?: number;
  };
  errors?: string[];
}

export class SeedService {
  /**
   * Seed all data
   */
  async seedAll(): Promise<SeedResult> {
    try {
      const results = await Promise.allSettled([
        this.seedPermissions(),
        this.seedRoles(),
        this.seedUsers(),
        this.seedConfigs(),
        this.seedAgents(),
        this.seedApiKeys(),
      ]);

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const errors = results
        .filter((r) => r.status === 'rejected')
        .map((r) => (r as PromiseRejectedResult).reason?.message || 'Unknown error');

      const data = {
        users: await prisma.user.count(),
        roles: await prisma.role.count(),
        permissions: await prisma.permission.count(),
        configs: await prisma.config.count(),
        agents: await prisma.agent.count(),
        apiKeys: await prisma.apiKey.count(),
      };

      return {
        success: successCount === results.length,
        message: `Seeded ${successCount}/${results.length} components successfully`,
        data,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error('Seed all error:', error);
      return {
        success: false,
        message: 'Failed to seed database',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Seed permissions from mock data
   */
  async seedPermissions(): Promise<SeedResult> {
    try {
      const existingCount = await prisma.permission.count();

      // Clear existing permissions if needed
      if (existingCount > 0) {
        await prisma.permission.deleteMany();
      }

      const permissions = await Promise.all(
        mockPermissions.map((permission) =>
          prisma.permission.create({
            data: {
              name: permission.name,
              description: permission.description,
              category: permission.category || 'general',
              route: permission.route,
              method: permission.method,
            },
          }),
        ),
      );

      return {
        success: true,
        message: `Successfully seeded ${permissions.length} permissions`,
        data: { permissions: permissions.length },
      };
    } catch (error) {
      console.error('Seed permissions error:', error);
      return {
        success: false,
        message: 'Failed to seed permissions',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Seed roles with permissions
   */
  async seedRoles(): Promise<SeedResult> {
    try {
      const existingCount = await prisma.role.count();

      // Clear existing roles if needed (this will also clear role-permission relations)
      if (existingCount > 0) {
        await prisma.role.deleteMany();
      }

      // Get all permissions for mapping
      const allPermissions = await prisma.permission.findMany();
      const permissionMap = new Map(allPermissions.map((p) => [p.name, p.id]));

      const roles = await Promise.all(
        mockRoles.map(async (role) => {
          // Filter permissions based on role's permission filter
          const rolePermissions = mockPermissions.filter(role.permissionFilter);
          const permissionIds = rolePermissions
            .map((p) => permissionMap.get(p.name))
            .filter(Boolean) as string[];

          return await prisma.role.create({
            data: {
              name: role.name,
              description: role.description,
              permissions: {
                connect: permissionIds.map((id) => ({ id })),
              },
            },
            include: {
              permissions: true,
            },
          });
        }),
      );

      return {
        success: true,
        message: `Successfully seeded ${roles.length} roles`,
        data: { roles: roles.length },
      };
    } catch (error) {
      console.error('Seed roles error:', error);
      return {
        success: false,
        message: 'Failed to seed roles',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Seed default users
   */
  async seedUsers(): Promise<SeedResult> {
    try {
      const existingAdminCount = await prisma.user.count({
        where: { email: 'admin@example.com' },
      });

      let createdCount = 0;

      // Create admin user if not exists
      if (existingAdminCount === 0) {
        const superAdminRole = await prisma.role.findFirst({
          where: { name: 'superadmin' },
        });

        const hashedPassword = 'admin123'; // Note: In production, hash with bcrypt

        await prisma.user.create({
          data: {
            email: 'admin@example.com',
            password: hashedPassword,
            nickname: 'System Administrator',
            status: 'active',
            role: superAdminRole
              ? {
                  connect: { id: superAdminRole.id },
                }
              : undefined,
          },
        });
        createdCount++;
      }

      // Create test user if not exists
      const existingUserCount = await prisma.user.count({
        where: { email: 'user@example.com' },
      });

      if (existingUserCount === 0) {
        const userRole = await prisma.role.findFirst({
          where: { name: 'user' },
        });

        const hashedPassword = 'user123'; // Note: In production, hash with bcrypt

        await prisma.user.create({
          data: {
            email: 'user@example.com',
            password: hashedPassword,
            nickname: 'Test User',
            status: 'active',
            role: userRole
              ? {
                  connect: { id: userRole.id },
                }
              : undefined,
          },
        });
        createdCount++;
      }

      return {
        success: true,
        message: `Successfully seeded ${createdCount} users`,
        data: { users: createdCount },
      };
    } catch (error) {
      console.error('Seed users error:', error);
      return {
        success: false,
        message: 'Failed to seed users',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Seed default configurations
   */
  async seedConfigs(): Promise<SeedResult> {
    try {
      const defaultConfigs = [
        {
          key: 'app_name',
          value: 'Auth API System',
          description: 'Application name displayed in UI',
        },
        {
          key: 'cors_origin',
          value: 'http://localhost:3000,http://localhost:5173',
          description: 'Allowed CORS origins',
        },
        {
          key: 'jwt_expiry',
          value: '24h',
          description: 'JWT token expiry time',
        },
        {
          key: 'max_login_attempts',
          value: '5',
          description: 'Maximum login attempts before lockout',
        },
        {
          key: 'session_timeout',
          value: '30m',
          description: 'User session timeout',
        },
      ];

      let createdCount = 0;

      for (const config of defaultConfigs) {
        const existing = await prisma.config.findUnique({
          where: { key: config.key },
        });

        if (!existing) {
          await prisma.config.create({ data: config });
          createdCount++;
        }
      }

      return {
        success: true,
        message: `Successfully seeded ${createdCount} configurations`,
        data: { configs: createdCount },
      };
    } catch (error) {
      console.error('Seed configs error:', error);
      return {
        success: false,
        message: 'Failed to seed configurations',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Seed default AI agents
   */
  async seedAgents(): Promise<SeedResult> {
    try {
      // Get admin user for agent ownership
      const adminUser = await prisma.user.findFirst({
        where: { email: 'admin@example.com' },
      });

      if (!adminUser) {
        return {
          success: false,
          message: 'Admin user not found for agent creation',
          errors: ['Admin user must be seeded first'],
        };
      }

      const defaultAgents = [
        {
          name: 'General Assistant',
          description: 'A helpful general-purpose AI assistant',
          model: 'gpt-4',
          systemPrompt:
            'You are a helpful AI assistant. Provide clear, accurate, and helpful responses to user queries.',
          personality: JSON.stringify({
            traits: ['helpful', 'professional', 'friendly'],
            style: 'conversational',
            expertise: ['general knowledge', 'problem solving'],
          }),
          config: JSON.stringify({
            temperature: 0.7,
            maxTokens: 1000,
            topP: 1.0,
          }),
          isActive: true,
          userId: adminUser.id,
        },
        {
          name: 'Code Assistant',
          description: 'Specialized AI assistant for programming and development',
          model: 'gpt-4',
          systemPrompt:
            'You are an expert programming assistant. Help with code, debugging, architecture, and best practices.',
          personality: JSON.stringify({
            traits: ['technical', 'precise', 'analytical'],
            style: 'detailed',
            expertise: ['programming', 'software architecture', 'debugging'],
          }),
          config: JSON.stringify({
            temperature: 0.3,
            maxTokens: 2000,
            topP: 0.9,
          }),
          isActive: true,
          userId: adminUser.id,
        },
      ];

      let createdCount = 0;

      for (const agent of defaultAgents) {
        const existing = await prisma.agent.findFirst({
          where: { name: agent.name, userId: adminUser.id },
        });

        if (!existing) {
          await prisma.agent.create({ data: agent });
          createdCount++;
        }
      }

      return {
        success: true,
        message: `Successfully seeded ${createdCount} AI agents`,
        data: { agents: createdCount },
      };
    } catch (error) {
      console.error('Seed agents error:', error);
      return {
        success: false,
        message: 'Failed to seed AI agents',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Seed default API keys
   */
  async seedApiKeys(): Promise<SeedResult> {
    try {
      const adminUser = await prisma.user.findFirst({
        where: { email: 'admin@example.com' },
      });

      if (!adminUser) {
        return {
          success: false,
          message: 'Admin user not found for API key creation',
          errors: ['Admin user must be seeded first'],
        };
      }

      const existingApiKey = await prisma.apiKey.findFirst({
        where: { name: 'Development API Key', userId: adminUser.id },
      });

      if (!existingApiKey) {
        await prisma.apiKey.create({
          data: {
            name: 'Development API Key',
            description: 'Default API key for development and testing',
            key: 'dev_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
            userId: adminUser.id,
            isActive: true,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          },
        });

        return {
          success: true,
          message: 'Successfully seeded 1 API key',
          data: { apiKeys: 1 },
        };
      }

      return {
        success: true,
        message: 'API key already exists',
        data: { apiKeys: 0 },
      };
    } catch (error) {
      console.error('Seed API keys error:', error);
      return {
        success: false,
        message: 'Failed to seed API keys',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Clear all data (dangerous operation)
   */
  async clearAll(): Promise<SeedResult> {
    try {
      await prisma.$transaction([
        prisma.message.deleteMany(),
        prisma.conversation.deleteMany(),
        prisma.agentMemory.deleteMany(),
        prisma.agentTool.deleteMany(),
        prisma.agent.deleteMany(),
        prisma.apiKey.deleteMany(),
        prisma.loginHistory.deleteMany(),
        prisma.logicHistory.deleteMany(),
        prisma.token.deleteMany(),
        prisma.mailTemplate.deleteMany(),
        prisma.notificationTemplate.deleteMany(),
        prisma.mail.deleteMany(),
        prisma.sSO.deleteMany(), // Correct field name
        prisma.config.deleteMany(),
        prisma.user.deleteMany(),
        prisma.role.deleteMany(),
        prisma.permission.deleteMany(),
      ]);

      return {
        success: true,
        message: 'Successfully cleared all data from database',
        data: {
          users: 0,
          roles: 0,
          permissions: 0,
          configs: 0,
          agents: 0,
          apiKeys: 0,
        },
      };
    } catch (error) {
      console.error('Clear all error:', error);
      return {
        success: false,
        message: 'Failed to clear database',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Get current database statistics
   */
  async getStats(): Promise<SeedResult> {
    try {
      const [users, roles, permissions, configs, agents, apiKeys, conversations, messages] =
        await Promise.all([
          prisma.user.count(),
          prisma.role.count(),
          prisma.permission.count(),
          prisma.config.count(),
          prisma.agent.count(),
          prisma.apiKey.count(),
          prisma.conversation.count(),
          prisma.message.count(),
        ]);

      return {
        success: true,
        message: 'Database statistics retrieved successfully',
        data: {
          users,
          roles,
          permissions,
          configs,
          agents,
          apiKeys,
          conversations,
          messages,
        },
      };
    } catch (error) {
      console.error('Get stats error:', error);
      return {
        success: false,
        message: 'Failed to retrieve database statistics',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Get seed data for viewing
   */
  async getSeedData(): Promise<any> {
    try {
      const [users, roles, permissions, configs, agents, apiKeys] = await Promise.all([
        prisma.user.findMany({
          select: {
            id: true,
            email: true,
            nickname: true,
            status: true,
            role: {
              select: {
                name: true,
              },
            },
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.role.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            _count: {
              select: {
                permissions: true,
                users: true,
              },
            },
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.permission.findMany({
          select: {
            id: true,
            name: true,
            category: true,
            route: true,
            method: true,
            description: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.config.findMany({
          select: {
            id: true,
            key: true,
            value: true,
          },
        }),
        prisma.agent.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            model: true,
            isActive: true,
            user: {
              select: {
                email: true,
              },
            },
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.apiKey.findMany({
          select: {
            id: true,
            name: true,
            key: true,
            isActive: true,
            expiresAt: true,
            user: {
              select: {
                email: true,
              },
            },
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      // Transform data for better display
      const transformedData = {
        users: users.map((user) => ({
          ...user,
          roleName: user.role?.name || 'No Role',
        })),
        roles: roles.map((role) => ({
          ...role,
          permissionCount: role._count.permissions,
          userCount: role._count.users,
        })),
        permissions,
        configs: configs.map((config) => ({
          ...config,
          value:
            typeof config.value === 'string' && config.value.length > 100
              ? config.value.substring(0, 100) + '...'
              : config.value,
        })),
        agents: agents.map((agent) => ({
          ...agent,
          userEmail: agent.user?.email || 'No User',
        })),
        apiKeys: apiKeys.map((key) => ({
          ...key,
          keyMasked: key.key ? `${key.key.substring(0, 10)}...` : 'No Key',
          userEmail: key.user?.email || 'No User',
        })),
      };

      return {
        success: true,
        message: 'Seed data retrieved successfully',
        data: transformedData,
      };
    } catch (error) {
      console.error('Get seed data error:', error);
      return {
        success: false,
        message: 'Failed to retrieve seed data',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }
}

export const seedService = new SeedService();
