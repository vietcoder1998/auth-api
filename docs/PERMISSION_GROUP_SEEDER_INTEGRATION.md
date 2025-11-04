# Permission Group Seeder Integration Guide

## Overview

The `PermissionGroupSeeder` has been created to establish hierarchical permission management in the system. This guide shows how to integrate it into the main seeding process.

## Integration Steps

### 1. Add Import to seed.ts

Add the following import to your seed.ts file alongside other seeder imports:

```typescript
import { PermissionGroupSeeder } from './seeders/permissionGroup.seeder';
```

### 2. Integration Point in seed.ts

Insert the permission group seeding between permission creation and role creation. Here's the recommended integration:

```typescript
// Existing: Seed permissions from mock data
console.log('🔐 Seeding Permissions...');
const uniquePermissions = Object.values(
  mockPermissions.reduce((acc: Record<string, any>, perm: any) => {
    acc[perm.name] = perm;
    return acc;
  }, {}),
);

const permissionRecords = await permissionRepo.seed(
  uniquePermissions.map((permission: any) => ({
    where: { name: permission.name },
    create: permission,
    update: {},
  })),
);

// NEW: Seed permission groups
console.log('📁 Seeding Permission Groups...');
const permissionGroups = await PermissionGroupSeeder.instance.run(permissionRecords);

// Existing: Seed roles (modify to include permission group assignment)
const { superadminRole, adminRole, userRole } = await RoleSeeder.instance.run(permissionRecords);

// NEW: Assign permission groups to roles
await PermissionGroupSeeder.instance.assignGroupsToRoles(permissionGroups, {
  superadminRole,
  adminRole,
  userRole
});
```

## Permission Group Structure

The seeder creates 8 permission groups:

1. **User Management** - User CRUD operations, profile management
2. **Content Management** - Blog posts, categories, content operations
3. **System Administration** - System configs, logs, critical operations
4. **AI & Agent Management** - AI agents, models, conversations
5. **API & Integration** - API keys, SSO, external integrations
6. **Monitoring & Analytics** - Reports, analytics, monitoring
7. **Job & Task Management** - Background jobs, task queues
8. **Configuration Management** - System settings, templates

## Role Assignment Strategy

- **Superadmin**: Gets ALL permission groups
- **Admin**: Gets most permission groups (excluding System Administration)
- **User**: Inherits permissions through role hierarchy

## Mock Data Structure

The seeder uses:
- `mockPermissionGroups` from `../../src/mock/permissionGroup.ts` - Group definitions
- `permissionGroupMappings` from the same file - Permission to group mappings

## Usage Benefits

1. **Hierarchical Permissions**: Organized permission structure
2. **Flexible Role Management**: Easy to assign/revoke permission groups
3. **Scalable Architecture**: Add new groups without changing role logic
4. **Clear Categorization**: Permissions grouped by functional area
5. **Maintainable Code**: Centralized permission group management

## Database Schema Impact

The seeder works with the existing schema:
- `PermissionGroup` model with 1:n relationship to permissions
- Role can have multiple permission groups (1:n relationship)
- Each permission group belongs to one role

## Error Handling

The seeder includes:
- Comprehensive error logging
- Transaction safety with upsert operations
- Validation of permission relationships
- Detailed progress reporting

## Next Steps

After integration:
1. Run `npm run seed` to populate permission groups
2. Verify role-permission group assignments
3. Test permission group functionality in the application
4. Update admin interfaces to manage permission groups

## Example Console Output

```
🔐 Seeding Permission Groups...
📋 Creating permission group: User Management with 15 permissions
✅ Permission group 'User Management' created/updated with 15 permissions
📋 Creating permission group: Content Management with 12 permissions
✅ Permission group 'Content Management' created/updated with 12 permissions
...
🎉 Successfully seeded 8 permission groups
🔗 Assigning permission groups to roles...
✅ Assigned all 8 permission groups to superadmin role
✅ Assigned 7 permission groups to admin role
✅ User role will inherit permissions through role hierarchy
🎉 Successfully assigned permission groups to roles
```