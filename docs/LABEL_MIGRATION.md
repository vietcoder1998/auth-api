# Label System Migration: N-N Relationship with Single Table

## Overview
The label system has been converted from using 20+ individual junction tables to a single generic `EntityLabel` table. This provides a more scalable and maintainable many-to-many relationship system.

## Schema Changes

### Before (Old System)
- 20+ separate junction tables: `UserLabel`, `RoleLabel`, `PermissionLabel`, etc.
- Each entity had a direct `labelId` field with default "mock-label-id"
- Complex schema with many tables

### After (New System)
- Single `EntityLabel` table handles all entity-label relationships
- Generic approach using `entityId`, `entityType`, and `labelId`
- Removed all direct `labelId` fields from entity tables

## New EntityLabel Table Structure

```prisma
model EntityLabel {
  id         String @id @default(uuid())
  entityId   String // ID of any entity (user, role, permission, etc.)
  entityType String // Type of entity (user, role, permission, token, etc.)
  labelId    String
  label      Label  @relation(fields: [labelId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())

  @@unique([entityId, entityType, labelId])
  @@index([entityId, entityType])
  @@index([labelId])
  @@index([entityType])
  @@map("entity_label")
}
```

## Benefits

1. **Scalability**: Adding new entities doesn't require new junction tables
2. **Maintainability**: Single table to manage instead of 20+ tables
3. **Flexibility**: Easy to query across all entity types
4. **Performance**: Better indexing strategy with composite indexes
5. **Consistency**: Uniform approach for all entity-label relationships

## Migration Steps

1. **Update Schema**: Apply the new Prisma schema
2. **Generate Prisma Client**: Run `npx prisma generate`
3. **Create Migration**: Run `npx prisma migrate dev --name "convert-to-single-entity-label-table"`
4. **Run Migration Script**: Execute the migration script to populate EntityLabel table
5. **Update Code**: Use new EntityLabel service methods

## API Changes

### Controller Updates
The label controller has been updated to work with the new EntityLabel structure:

- `getLabels()`: Now counts `entityLabels` instead of individual junction table counts
- `getLabelById()`: Uses `entityLabels` relationship
- `deleteLabel()`: Checks `entityLabels` usage count
- `bulkDeleteByLabelNames()`: Deletes entities by IDs found in EntityLabel table
- `getLabelStatistics()`: Groups statistics by entity type

### Service Layer
New `EntityLabelService` provides utility methods:

```typescript
// Add labels to an entity
await EntityLabelService.addLabelsToEntity(userId, 'user', [labelId1, labelId2]);

// Get all labels for an entity
const userLabels = await EntityLabelService.getLabelsForEntity(userId, 'user');

// Remove specific labels from an entity
await EntityLabelService.removeLabelsFromEntity(userId, 'user', [labelId]);

// Replace all labels for an entity
await EntityLabelService.replaceEntityLabels(userId, 'user', [newLabelId1, newLabelId2]);

// Get entities with specific label
const entitiesWithLabel = await EntityLabelService.getEntitiesWithLabel(labelId, 'user');
```

## Usage Examples

### Adding Labels to Entities
```typescript
// Add multiple labels to a user
await prisma.entityLabel.createMany({
  data: [
    { entityId: userId, entityType: 'user', labelId: 'label1' },
    { entityId: userId, entityType: 'user', labelId: 'label2' }
  ],
  skipDuplicates: true
});
```

### Querying Entities by Labels
```typescript
// Get all users with 'production' label
const productionUsers = await prisma.entityLabel.findMany({
  where: {
    entityType: 'user',
    label: { name: 'production' }
  },
  include: { label: true }
});
```

### Getting Labels for an Entity
```typescript
// Get all labels for a specific user
const userLabels = await prisma.entityLabel.findMany({
  where: {
    entityId: userId,
    entityType: 'user'
  },
  include: { label: true }
});
```

### Statistics and Analytics
```typescript
// Get label usage by entity type
const stats = await prisma.entityLabel.groupBy({
  by: ['entityType'],
  _count: { entityType: true }
});
```

## Entity Types
The following entity types are supported:
- `user`
- `role`
- `permission`
- `token`
- `mailTemplate`
- `notificationTemplate`
- `config`
- `apiKey`
- `apiUsageLog`
- `mail`
- `sso`
- `loginHistory`
- `logicHistory`
- `agent`
- `agentMemory`
- `conversation`
- `message`
- `agentTool`
- `agentTask`

## Performance Considerations

### Indexes
The EntityLabel table includes optimized indexes:
- Composite unique index on `[entityId, entityType, labelId]`
- Individual indexes on `[entityId, entityType]`, `labelId`, and `entityType`

### Query Optimization
- Use specific entity types in queries when possible
- Leverage the composite indexes for better performance
- Consider using `include` vs `select` based on data needs

## Testing
After migration, verify:
1. All entities can have labels assigned
2. Label statistics are accurate
3. Bulk delete operations work correctly
4. Performance is acceptable for your data size

## Rollback Plan
If needed, the old junction tables can be recreated from the EntityLabel data, but this would require a reverse migration script.

## Next Steps
1. Run `npx prisma generate` to update the Prisma client
2. Create and run the database migration
3. Execute the migration script to populate EntityLabel table
4. Test the new functionality
5. Update any custom code that relied on the old junction tables