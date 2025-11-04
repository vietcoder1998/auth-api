import { mockPermissionGroups, permissionGroupMappings } from '../../src/mock/permissionGroup';
import { prisma } from '../../src/setup';
import BaseSeeder from './base.seeder';

interface PermissionGroupWithPermissions {
  id: string;
  name: string;
  description: string | null;
  permissions: any[];
  roles?: any[]; // Now supports multiple roles via many-to-many
  roleId?: string | null; // Kept for backward compatibility but will be removed
  createdAt: Date;
  updatedAt: Date;
}

export class PermissionGroupSeeder extends BaseSeeder {
  public static instance = new PermissionGroupSeeder();

  constructor() {
    super();
  }

  /**
   * Seed permission groups and link them with permissions
   * @param permissionRecords - Array of created permission records
   * @returns Created permission groups with their linked permissions
   */
  public async run(permissionRecords: any[]): Promise<PermissionGroupWithPermissions[]> {
    console.log('🔐 Seeding Permission Groups...');

    const createdPermissionGroups: PermissionGroupWithPermissions[] = [];

    // Create a map of permission names to IDs for quick lookup
    const permissionNameToId = new Map<string, string>();
    permissionRecords.forEach((permission: any) => {
      permissionNameToId.set(permission.name, permission.id);
    });

    // Process each permission group
    for (const groupData of mockPermissionGroups) {
      try {
        // Get permission IDs for this group
        const groupPermissionNames = permissionGroupMappings[groupData.name as keyof typeof permissionGroupMappings] || [];
        const validPermissionIds = groupPermissionNames
          .map((name: string) => permissionNameToId.get(name))
          .filter(Boolean) as string[];

        console.log(`📋 Creating permission group: ${groupData.name} with ${validPermissionIds.length} permissions`);

        // Create or update the permission group first
        const permissionGroup = await prisma.permissionGroup.upsert({
          where: { name: groupData.name },
          create: {
            name: groupData.name,
            description: groupData.description,
          },
          update: {
            description: groupData.description,
          }
        });

        // TODO: After running prisma generate, use the junction table approach
        // For now, we'll use raw SQL to handle the many-to-many relationships
        
        // Clear existing permission relationships for this group
        await prisma.$executeRaw`
          DELETE FROM permission_group_permission 
          WHERE permissionGroupId = ${permissionGroup.id}
        `;

        // Create new permission relationships
        if (validPermissionIds.length > 0) {
          for (const permissionId of validPermissionIds) {
            await prisma.$executeRaw`
              INSERT INTO permission_group_permission (id, permissionGroupId, permissionId, createdAt)
              VALUES (UUID(), ${permissionGroup.id}, ${permissionId}, NOW())
              ON DUPLICATE KEY UPDATE createdAt = NOW()
            `;
          }
        }

        // Fetch permissions for this group using raw query
        const groupPermissions = await prisma.$queryRaw`
          SELECT p.* FROM permission p
          JOIN permission_group_permission pgp ON p.id = pgp.permissionId
          WHERE pgp.permissionGroupId = ${permissionGroup.id}
        ` as any[];

        // Transform to match expected interface
        const transformedGroup: PermissionGroupWithPermissions = {
          id: permissionGroup.id,
          name: permissionGroup.name,
          description: permissionGroup.description,
          permissions: groupPermissions,
          roleId: null, // Will be updated in assignGroupsToRoles
          createdAt: permissionGroup.createdAt,
          updatedAt: permissionGroup.updatedAt
        };

        createdPermissionGroups.push(transformedGroup);

        console.log(`✅ Permission group '${groupData.name}' created/updated with ${transformedGroup.permissions.length} permissions`);
        
        // Log which permissions were linked
        if (this.isVerbose()) {
          console.log(`   Linked permissions:`, transformedGroup.permissions.map((p: any) => p.name));
        }

      } catch (error) {
        console.error(`❌ Failed to create permission group '${groupData.name}':`, error);
        throw error;
      }
    }

    console.log(`🎉 Successfully seeded ${createdPermissionGroups.length} permission groups`);
    
    // Summary of groups and their permission counts
    createdPermissionGroups.forEach(group => {
      console.log(`   📁 ${group.name}: ${group.permissions.length} permissions`);
    });

    return createdPermissionGroups;
  }

  /**
   * Assign permission groups to roles (many-to-many)
   * @param permissionGroups - Created permission groups
   * @param roles - Role objects with IDs
   */
  public async assignGroupsToRoles(
    permissionGroups: PermissionGroupWithPermissions[],
    roles: { superadminRole: any; adminRole: any; userRole: any }
  ): Promise<void> {
    console.log('🔗 Assigning permission groups to roles...');

    const { superadminRole, adminRole, userRole } = roles;

    try {
      // Clear existing role-group assignments
      await prisma.$executeRaw`DELETE FROM role_permission_group`;

      // Superadmin gets all permission groups
      for (const group of permissionGroups) {
        await prisma.$executeRaw`
          INSERT INTO role_permission_group (id, roleId, permissionGroupId, createdAt)
          VALUES (UUID(), ${superadminRole.id}, ${group.id}, NOW())
        `;
      }

      console.log(`✅ Assigned all ${permissionGroups.length} permission groups to superadmin role`);

      // Admin gets most permission groups (excluding system administration)
      const adminGroupNames = [
        'User Management',
        'Content Management', 
        'AI & Agent Management',
        'API & Integration',
        'Monitoring & Analytics',
        'Job & Task Management',
        'Configuration Management'
      ];
      
      const adminGroups = permissionGroups.filter(group => adminGroupNames.includes(group.name));
      
      // Assign admin groups to admin role
      for (const group of adminGroups) {
        await prisma.$executeRaw`
          INSERT INTO role_permission_group (id, roleId, permissionGroupId, createdAt)
          VALUES (UUID(), ${adminRole.id}, ${group.id}, NOW())
          ON DUPLICATE KEY UPDATE createdAt = NOW()
        `;
      }

      console.log(`✅ Assigned ${adminGroups.length} permission groups to admin role`);

      // Regular user gets limited permission groups
      const userGroupNames = [
        'Content Management', // Basic content viewing/editing
        'AI & Agent Management' // Basic AI interaction
      ];
      
      const userGroups = permissionGroups.filter(group => userGroupNames.includes(group.name));
      
      // Assign user groups to user role
      for (const group of userGroups) {
        await prisma.$executeRaw`
          INSERT INTO role_permission_group (id, roleId, permissionGroupId, createdAt)
          VALUES (UUID(), ${userRole.id}, ${group.id}, NOW())
          ON DUPLICATE KEY UPDATE createdAt = NOW()
        `;
      }

      console.log(`✅ Assigned ${userGroups.length} permission groups to user role`);
      console.log(`   User groups: ${userGroupNames.join(', ')}`);

      console.log('🎉 Successfully assigned permission groups to roles using many-to-many relationships');

    } catch (error) {
      console.error('❌ Failed to assign permission groups to roles:', error);
      throw error;
    }
  }

  /**
   * Utility method to check verbose logging
   */
  private isVerbose(): boolean {
    return process.env.SEED_VERBOSE === 'true';
  }
}

export default PermissionGroupSeeder;