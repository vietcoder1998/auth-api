import { RoleDro, RoleDto } from '../../src/interfaces';
import { mockPermissions } from '../../src/mock/permissions';
import { RoleRepository } from '../../src/repositories';
import { prisma } from '../../src/setup';
import BaseSeeder from './base.seeder';

export class RoleSeeder extends BaseSeeder {
  public static instance = new RoleSeeder();

  private roleRepository = new RoleRepository(prisma.role);
  constructor() {
    super();
  }

  public async run(permissionRecords: unknown[]) {
    // Create roles
    console.log('👑 Seeding Roles...');
    const superadminRole: RoleDto = await this.roleRepository.upsert(
      { name: 'superadmin' },
      {
        name: 'superadmin',
        permissions: {
          connect: permissionRecords.map((p: any) => ({ id: p.id })),
        },
      },
      {
        permissions: {
          connect: permissionRecords.map((p: any) => ({ id: p.id })), // Update to include all permissions
        },
      },
    );
    const adminRole: RoleDto = await this.roleRepository.upsert(
      { name: 'admin' },
      {
        name: 'admin',
        permissions: {
          connect: permissionRecords
            .filter((p: any) =>
              [
                'manage_users',
                'view_reports',
                'admin_login_history_get',
                'admin_logic_history_get',
                'admin_cache_get',
                'admin_cache_post',
                'admin_cache_delete',
                'admin_conversations_get',
                'admin_conversations_get_single',
                'admin_conversations_post',
                'admin_conversations_put',
                'admin_conversations_delete',
                'admin_conversations_messages_get',
                'admin_conversations_messages_post',
                'admin_messages_get',
                'admin_messages_post',
                'admin_agents_get',
                'admin_agents_get_single',
                'admin_agents_post',
                'admin_agents_put',
                'admin_agents_delete',
                'admin_agents_memories_get',
                'admin_agents_memories_post',
                'view_conversations',
                'create_conversations',
                'view_messages',
                'send_messages',
                'view_ai_agents',
                'chat_with_agents',
                // Database connection permissions
                'admin_database_connections_get',
                'admin_database_connections_post',
                'admin_database_connections_put',
                'admin_database_connections_delete',
                'admin_database_connections_test',
                'admin_database_connections_check',
                'admin_database_connections_backup',
                'admin_database_connections_stats',
                'view_database_connections',
                'manage_database_connections',
                'create_database_connections',
                'update_database_connections',
                'delete_database_connections',
                'test_database_connections',
                'backup_databases',
                // Log management permissions
                'admin_logs_get',
                'admin_logs_post',
                'admin_logs_stats',
                'admin_logs_export',
                'admin_logs_clear',
                'view_logs',
                'manage_logs',
                'create_logs',
              ].includes(p.name),
            )
            .map((p: any) => ({ id: p.id })),
        },
      },
      {
        permissions: {
          connect: permissionRecords
            .filter((p: any) => {
              // Dynamically fetch all permission names from mockPermissions
              const adminPermissionNames = mockPermissions.map((perm: any) => perm.name);
              return adminPermissionNames.includes(p.name);
            })
            .map((p: any) => ({ id: p.id })),
        },
      },
    );
    const userRole: RoleDto = await prisma.role.upsert({
      where: { name: 'user' },
      update: {
        permissions: {
          set: permissionRecords
            .filter((p: any) =>
              [
                'view_self',
                'view_conversations',
                'create_conversations',
                'view_messages',
                'send_messages',
                'view_ai_agents',
                'chat_with_agents',
              ].includes(p.name),
            )
            .map((p: any) => ({ id: p.id })),
        },
      },
      create: {
        name: 'user',
        permissions: {
          connect: permissionRecords
            .filter((p: any) =>
              [
                'view_self',
                'view_conversations',
                'create_conversations',
                'view_messages',
                'send_messages',
                'view_ai_agents',
                'chat_with_agents',
              ].includes(p.name),
            )
            .map((p: any) => ({ id: p.id })),
        },
      },
    });

    return {
      userRole,
      superadminRole,
      adminRole,
    };
  }
}
