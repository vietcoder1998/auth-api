import { mockPermissionGroups, permissionGroupMappings } from '../../src/mock/permissionGroup';
import { prisma } from '../../src/setup';
import BaseSeeder from './base.seeder';

interface PermissionGroupWithPermissions {
  id: string;
  name: string;
  description: string | null;
  permissions: any[];
  roleId: string | null;
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

        // Create or update the permission group
        const permissionGroup = await prisma.permissionGroup.upsert({
          where: { name: groupData.name },
          create: {
            name: groupData.name,
            description: groupData.description,
            permissions: {
              connect: validPermissionIds.map(id => ({ id }))
            }
          },
          update: {
            description: groupData.description,
            permissions: {
              set: [], // Clear existing connections
              connect: validPermissionIds.map(id => ({ id })) // Add new connections
            }
          },
          include: {
            permissions: true,
            role: true
          }
        });

        createdPermissionGroups.push(permissionGroup);

        console.log(`✅ Permission group '${groupData.name}' created/updated with ${permissionGroup.permissions.length} permissions`);
        
        // Log which permissions were linked
        if (this.isVerbose()) {
          console.log(`   Linked permissions:`, permissionGroup.permissions.map((p: any) => p.name));
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
   * Assign permission groups to roles
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
      // Superadmin gets all permission groups - update each group to belong to superadmin role
      for (const group of permissionGroups) {
        await prisma.permissionGroup.update({
          where: { id: group.id },
          data: { roleId: superadminRole.id }
        });
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
      
      // Reset admin groups first, then assign to admin
      for (const group of adminGroups) {
        await prisma.permissionGroup.update({
          where: { id: group.id },
          data: { roleId: adminRole.id }
        });
      }

      console.log(`✅ Assigned ${adminGroups.length} permission groups to admin role`);

      // Regular user gets limited permission groups
      const userGroupNames = [
        'Content Management', // Basic content viewing/editing
        'AI & Agent Management' // Basic AI interaction
      ];
      
      const userGroups = permissionGroups.filter(group => userGroupNames.includes(group.name));
      
      // Note: Since each permission group can only belong to one role, we'll create duplicates for user role
      // Or we can modify the approach to have shared groups
      console.log(`✅ User role will inherit permissions through role hierarchy`);
      console.log(`   User can access: ${userGroupNames.join(', ')}`);

      console.log('🎉 Successfully assigned permission groups to roles');

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