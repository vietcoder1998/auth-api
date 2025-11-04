# Implementation Guide: Many-to-Many Permission Groups

## Prerequisites
- Database backup created
- Development environment ready
- Git repository in clean state

## Step-by-Step Implementation

### Step 1: Apply Database Migration
```bash
# Navigate to auth-api directory
cd D:\COMPANY\Freelancer\todo-app\auth-api

# Execute the migration script
mysql -u [username] -p [database_name] < prisma/migrations/migration-many-to-many-permission-groups.sql

# Or using MySQL Workbench: Open and execute the migration file
```

### Step 2: Regenerate Prisma Client
```bash
# Generate new Prisma client with updated schema
npx prisma generate

# Verify schema is correct
npx prisma db pull
```

### Step 3: Test Database Changes
```bash
# Run the seeder to test new relationships
npm run seed

# Or run specific seeders
npm run seed:permission-groups
```

### Step 4: Update Backend Services (If Needed)

#### Update Permission Group Service
```typescript
// Example: Update getPermissionGroups to include roles
async getPermissionGroups(options: QueryOptions) {
  return await this.permissionGroupRepository.findMany({
    ...options,
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
}
```

#### Update Role Service
```typescript
// Example: Update getRoles to include permission groups
async getRoles(options: QueryOptions) {
  return await this.roleRepository.findMany({
    ...options,
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
}
```

### Step 5: Verify Frontend Compatibility
```bash
# Navigate to auth-ui directory
cd D:\COMPANY\Freelancer\todo-app\auth-ui

# Start development server
npm run dev

# Test the following pages:
# - Admin Permission Management
# - Role Management
# - Permission Group Assignment
```

### Step 6: Update API Endpoints (If Required)

#### Add Junction Table Operations
```typescript
// Add permission group to role
async assignGroupToRole(groupId: string, roleId: string) {
  return await prisma.rolePermissionGroup.create({
    data: {
      permissionGroupId: groupId,
      roleId: roleId
    }
  });
}

// Remove permission group from role
async unassignGroupFromRole(groupId: string, roleId: string) {
  return await prisma.rolePermissionGroup.deleteMany({
    where: {
      permissionGroupId: groupId,
      roleId: roleId
    }
  });
}

// Get groups by role
async getGroupsByRole(roleId: string) {
  return await prisma.rolePermissionGroup.findMany({
    where: { roleId },
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
  });
}
```

## Validation Checklist

### Database Validation
- [ ] Junction tables created successfully
- [ ] Existing data migrated correctly
- [ ] Foreign key constraints working
- [ ] Old columns removed without errors

### Seeder Validation
- [ ] Permission groups created with correct permissions
- [ ] Role-group assignments working
- [ ] No duplicate relationships
- [ ] Proper error handling

### Frontend Validation
- [ ] Permission groups display multiple roles
- [ ] Role assignment modal functions correctly
- [ ] Roles tab shows permission groups
- [ ] No console errors or compilation issues

### API Validation
- [ ] Get permission groups returns roles array
- [ ] Get roles returns permission groups
- [ ] Create/update operations work correctly
- [ ] Junction table operations function properly

## Rollback Plan (If Needed)

### Step 1: Restore Database
```sql
-- If migration fails, restore from backup
-- Or manually recreate old structure:

ALTER TABLE permission_group ADD COLUMN roleId VARCHAR(191);
ALTER TABLE permission ADD COLUMN permissionGroupId VARCHAR(191);

-- Restore old relationships from junction tables
UPDATE permission_group pg 
SET roleId = (
  SELECT rpg.roleId 
  FROM role_permission_group rpg 
  WHERE rpg.permissionGroupId = pg.id 
  LIMIT 1
);

UPDATE permission p
SET permissionGroupId = (
  SELECT pgp.permissionGroupId
  FROM permission_group_permission pgp
  WHERE pgp.permissionId = p.id
  LIMIT 1
);

-- Drop junction tables
DROP TABLE role_permission_group;
DROP TABLE permission_group_permission;
```

### Step 2: Revert Schema
```bash
# Checkout previous schema version
git checkout HEAD~1 -- prisma/schema.prisma

# Regenerate client
npx prisma generate
```

## Common Issues & Solutions

### Issue 1: Prisma Client Out of Sync
**Error**: `Property 'permissionGroupPermission' does not exist`
**Solution**: Run `npx prisma generate` after schema changes

### Issue 2: Migration Foreign Key Errors
**Error**: `Cannot add foreign key constraint`
**Solution**: Ensure referenced tables exist and have proper primary keys

### Issue 3: Seeder Permission Errors
**Error**: `Permission 'xyz' not found`
**Solution**: Verify permission names match exactly with mock data

### Issue 4: Frontend Type Errors
**Error**: `Property 'roles' does not exist on type 'PermissionGroup'`
**Solution**: Update TypeScript interfaces to match new schema

## Testing Scenarios

### Test Case 1: Permission Group Assignment
1. Create a new permission group
2. Assign multiple permissions to the group
3. Assign the group to multiple roles
4. Verify relationships in database
5. Test frontend display

### Test Case 2: Role Management
1. View roles tab in admin interface
2. Verify permission groups are displayed correctly
3. Test role assignment to groups
4. Verify cascade operations work

### Test Case 3: Data Integrity
1. Delete a permission group
2. Verify junction table entries are removed
3. Verify roles and permissions remain intact
4. Test referential integrity constraints

### Test Case 4: Performance
1. Load page with large number of groups/roles
2. Measure query performance
3. Verify indexes are being used
4. Test pagination with new relationships

## Success Criteria

- ✅ Database migration completes without errors
- ✅ All existing data is preserved and properly migrated
- ✅ Frontend displays multiple roles per permission group
- ✅ Role assignment functionality works correctly
- ✅ No performance degradation in admin interfaces
- ✅ All tests pass with new schema
- ✅ Seeder creates proper many-to-many relationships

## Post-Implementation Tasks

1. **Monitor Performance**: Track query performance with new indexes
2. **Update Documentation**: Ensure all API documentation reflects new structure
3. **Training**: Update team documentation on new relationship model
4. **Backup Strategy**: Update backup procedures to include junction tables
5. **Future Enhancements**: Plan for additional many-to-many relationships if needed

This implementation provides a robust foundation for complex permission management while maintaining backward compatibility and data integrity.