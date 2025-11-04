# Many-to-Many Permission Groups Implementation

## Overview
This document outlines the implementation of many-to-many relationships for permission groups with both roles and permissions, replacing the previous 1:n relationships.

## Database Schema Changes

### Previous Schema (1:n relationships)
```prisma
model Role {
  permissionGroups PermissionGroup[] // 1:n relationship
}

model PermissionGroup {
  roleId      String?      // n:1 relationship with role
  role        Role?        @relation(fields: [roleId], references: [id])
  permissions Permission[] // 1:n relationship with permissions
}

model Permission {
  permissionGroupId String?
  permissionGroup   PermissionGroup? @relation(fields: [permissionGroupId], references: [id])
}
```

### New Schema (n:n relationships)
```prisma
model Role {
  // Many-to-many relationship with permission groups through junction table
  permissionGroups RolePermissionGroup[]
}

model PermissionGroup {
  // Many-to-many relationship with permissions through junction table
  permissions PermissionGroupPermission[]
  // Many-to-many relationship with roles through junction table
  roles       RolePermissionGroup[]
}

model Permission {
  // Many-to-many relationship with permission groups through junction table
  permissionGroups PermissionGroupPermission[]
}

// Junction table for Role <-> PermissionGroup (many-to-many)
model RolePermissionGroup {
  id                String          @id @default(uuid())
  roleId            String
  permissionGroupId String
  role              Role            @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permissionGroup   PermissionGroup @relation(fields: [permissionGroupId], references: [id], onDelete: Cascade)
  createdAt         DateTime        @default(now())

  @@unique([roleId, permissionGroupId])
  @@index([roleId])
  @@index([permissionGroupId])
  @@map("role_permission_group")
}

// Junction table for PermissionGroup <-> Permission (many-to-many)
model PermissionGroupPermission {
  id                String          @id @default(uuid())
  permissionGroupId String
  permissionId      String
  permissionGroup   PermissionGroup @relation(fields: [permissionGroupId], references: [id], onDelete: Cascade)
  permission        Permission      @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  createdAt         DateTime        @default(now())

  @@unique([permissionGroupId, permissionId])
  @@index([permissionGroupId])
  @@index([permissionId])
  @@map("permission_group_permission")
}
```

## Migration Process

### 1. Database Migration
A migration script (`migration-many-to-many-permission-groups.sql`) has been created to:

1. **Create Junction Tables**: Creates `role_permission_group` and `permission_group_permission` tables
2. **Migrate Existing Data**: Preserves existing relationships by copying data to junction tables
3. **Add Foreign Key Constraints**: Ensures referential integrity
4. **Remove Old Columns**: Cleans up `roleId` from `permission_group` and `permissionGroupId` from `permission`

### 2. Seeder Updates
The `PermissionGroupSeeder` has been updated to:

#### Enhanced Permission Group Creation
```typescript
// Create permission group
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

// Clear existing permission relationships
await prisma.$executeRaw`
  DELETE FROM permission_group_permission 
  WHERE permissionGroupId = ${permissionGroup.id}
`;

// Create new permission relationships
for (const permissionId of validPermissionIds) {
  await prisma.$executeRaw`
    INSERT INTO permission_group_permission (id, permissionGroupId, permissionId, createdAt)
    VALUES (UUID(), ${permissionGroup.id}, ${permissionId}, NOW())
    ON DUPLICATE KEY UPDATE createdAt = NOW()
  `;
}
```

#### Enhanced Role Assignment
```typescript
// Superadmin gets all permission groups
for (const group of permissionGroups) {
  await prisma.$executeRaw`
    INSERT INTO role_permission_group (id, roleId, permissionGroupId, createdAt)
    VALUES (UUID(), ${superadminRole.id}, ${group.id}, NOW())
  `;
}

// Admin gets specific groups
const adminGroups = permissionGroups.filter(group => adminGroupNames.includes(group.name));
for (const group of adminGroups) {
  await prisma.$executeRaw`
    INSERT INTO role_permission_group (id, roleId, permissionGroupId, createdAt)
    VALUES (UUID(), ${adminRole.id}, ${group.id}, NOW())
    ON DUPLICATE KEY UPDATE createdAt = NOW()
  `;
}

// User gets limited groups
const userGroups = permissionGroups.filter(group => userGroupNames.includes(group.name));
for (const group of userGroups) {
  await prisma.$executeRaw`
    INSERT INTO role_permission_group (id, roleId, permissionGroupId, createdAt)
    VALUES (UUID(), ${userRole.id}, ${group.id}, NOW())
    ON DUPLICATE KEY UPDATE createdAt = NOW()
  `;
}
```

## Frontend Updates (AddPermissionRolePage)

### Interface Changes
```typescript
// Updated PermissionGroup interface
interface PermissionGroup {
  id: string;
  name: string;
  description?: string;
  roles?: Role[]; // Changed from single role to array of roles
  permissions?: Permission[];
  _count?: {
    permissions: number;
    roles?: number; // Added role count
  };
  createdAt: string;
  updatedAt: string;
}
```

### Enhanced Display Components
- **Multiple Roles Display**: Shows array of roles as colored tags
- **Enhanced Actions**: "Assign Roles" button for managing role assignments
- **Role Assignment Modal**: Transfer component for assigning multiple roles to groups
- **New Roles Tab**: Complete view of roles with their assigned permission groups

### API Integration Updates
```typescript
// Role assignment using many-to-many approach
const handleTransferRoles = async () => {
  // Current implementation uses temporary single-role assignment
  // Will be updated to support full many-to-many when backend is ready
  if (roleTransferTargetKeys.length > 0) {
    const primaryRoleId = roleTransferTargetKeys[0];
    await adminApi.assignGroupToRole(selectedGroupForRoles.id, primaryRoleId);
  } else {
    await adminApi.unassignGroupFromRole(selectedGroupForRoles.id);
  }
};
```

## Permission Group Mappings

### Predefined Permission Groups
The system defines 8 main permission groups with specific permission assignments:

1. **User Management**: User accounts, roles, permissions, authentication
2. **Content Management**: Blogs, documents, files, FAQs
3. **System Administration**: Cache, database connections, system configuration
4. **AI & Agent Management**: AI agents, models, platforms, conversations, prompts
5. **API & Integration**: API keys, SSO, external integrations
6. **Monitoring & Analytics**: Logs, history, reports, notifications
7. **Job & Task Management**: Background jobs, automated tasks
8. **Configuration Management**: System config, templates, UI settings

### Role-Based Group Assignment
```typescript
const roleGroupAssignments = {
  superadmin: ['All Groups'], // Gets all 8 groups
  admin: [
    'User Management',
    'Content Management',
    'AI & Agent Management',
    'API & Integration',
    'Monitoring & Analytics',
    'Job & Task Management',
    'Configuration Management'
  ], // 7 groups (excludes System Administration)
  user: [
    'Content Management',
    'AI & Agent Management'
  ] // 2 groups (basic access)
};
```

## Benefits of Many-to-Many Relationships

### 1. **Flexibility**
- Permission groups can be assigned to multiple roles
- Roles can have multiple permission groups
- Permissions can belong to multiple groups

### 2. **Scalability**
- Easy to add new roles without duplicating permission groups
- Granular permission control per role
- Support for complex organizational structures

### 3. **Maintainability**
- Centralized permission group definitions
- Easier to update permissions across multiple roles
- Clear separation of concerns

### 4. **Performance**
- Efficient querying with proper indexes
- Reduced data duplication
- Optimized junction table design

## Implementation Status

### ✅ Completed
- [x] Database schema updated with junction tables
- [x] Migration script created for data preservation
- [x] Permission group seeder updated for n:n relationships
- [x] Frontend interfaces updated to support multiple roles
- [x] Role assignment modal with transfer component
- [x] Enhanced display components with role counts

### 🔄 In Progress
- [ ] Prisma client regeneration (requires `npx prisma generate`)
- [ ] Backend API updates for full n:n support
- [ ] Database migration execution

### 📋 TODO
- [ ] Update API endpoints to handle junction table operations
- [ ] Full integration testing with new relationships
- [ ] Performance optimization and indexing review
- [ ] Documentation updates for API consumers

## Usage Examples

### Querying Permission Groups with Roles
```typescript
// Fetch permission group with all associated roles
const groupWithRoles = await prisma.permissionGroup.findUnique({
  where: { id: groupId },
  include: {
    roles: {
      include: {
        role: true
      }
    },
    permissions: {
      include: {
        permission: true
      }
    }
  }
});
```

### Querying Roles with Permission Groups
```typescript
// Fetch role with all associated permission groups
const roleWithGroups = await prisma.role.findUnique({
  where: { id: roleId },
  include: {
    permissionGroups: {
      include: {
        permissionGroup: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    }
  }
});
```

### Adding/Removing Group-Role Associations
```typescript
// Add permission group to role
await prisma.rolePermissionGroup.create({
  data: {
    roleId: roleId,
    permissionGroupId: groupId
  }
});

// Remove permission group from role
await prisma.rolePermissionGroup.deleteMany({
  where: {
    roleId: roleId,
    permissionGroupId: groupId
  }
});
```

## Next Steps

1. **Execute Migration**: Run the migration script on the database
2. **Regenerate Prisma Client**: Execute `npx prisma generate`
3. **Update API Endpoints**: Modify backend services to use junction tables
4. **Integration Testing**: Test the complete flow with new relationships
5. **Performance Monitoring**: Monitor query performance with new indexes

This implementation provides a robust, scalable foundation for managing complex permission structures while maintaining data integrity and performance.