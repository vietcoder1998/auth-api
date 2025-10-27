# BaseRepository API Documentation

**File:** `src/repositories/base.repository.ts`  
**Last Updated:** October 25, 2025

---

## Overview

The `BaseRepository` class is a generic repository pattern implementation that provides common CRUD operations and batch processing for all entity repositories in the auth-api project. All entity-specific repositories extend this base class.

---

## Class Signature

```typescript
export class BaseRepository<T, Dto, Dro> extends BaseInterface
```

### Type Parameters

- **T** - The Prisma model delegate type (e.g., `PrismaClient['user']`)
- **Dto** - Data Transfer Object type for input operations
- **Dro** - Data Response Object type for output operations

---

## Constructor

```typescript
constructor(model: T, prisma?: PrismaClient)
```

Creates a new repository instance.

**Parameters:**
- `model` - Prisma model delegate (e.g., `prisma.user`)
- `prisma` - Optional PrismaClient instance (uses default if not provided)

**Example:**
```typescript
export class UserRepository extends BaseRepository<UserModel, UserDto, UserDto> {
  constructor(userDelegate = prisma.user) {
    super(userDelegate);
  }
}
```

---

## Core Methods

### 📖 Read Operations

#### `findById(id: string): Promise<Dro | null>`

Find a single record by its ID.

**Parameters:**
- `id` - The unique identifier of the record

**Returns:** The found record or `null` if not found

**Example:**
```typescript
const user = await userRepo.findById('123');
if (user) {
  console.log(user.email);
}
```

---

#### `findMany(where?: any): Promise<Dro[]>`

Find multiple records with optional filtering.

**Parameters:**
- `where` - Optional condition to filter records

**Returns:** Array of matching records

**Examples:**
```typescript
// Find all active users
const activeUsers = await userRepo.findMany({ status: 'active' });

// Find all records
const allUsers = await userRepo.findMany();

// Complex filtering
const users = await userRepo.findMany({
  role: 'admin',
  createdAt: { gte: new Date('2024-01-01') }
});
```

---

#### `search(params: SearchParams): Promise<Dro[]>`

Search for records using custom parameters including pagination, sorting, and relations.

**Parameters:**
- `params` - Search parameters object with properties:
  - `where` - Filter conditions
  - `orderBy` - Sorting configuration
  - `skip` - Number of records to skip (pagination)
  - `take` - Number of records to take (limit)
  - `include` - Relations to include
  - `select` - Fields to select

**Returns:** Array of matching records

**Example:**
```typescript
const users = await userRepo.search({
  where: { status: 'active' },
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: 0,
  include: { roles: true }
});
```

---

### ✏️ Write Operations

#### `create(data: Dto): Promise<Dro>`

Create a new record.

**Parameters:**
- `data` - Data for creating the record

**Returns:** The created record

**Example:**
```typescript
const newUser = await userRepo.create({
  email: 'user@example.com',
  name: 'John Doe',
  status: 'active'
});
```

---

#### `update(id: string, data: Partial<Dto>): Promise<Dro>`

Update an existing record by ID.

**Parameters:**
- `id` - The unique identifier of the record to update
- `data` - Partial data to update

**Returns:** The updated record

**Example:**
```typescript
const updatedUser = await userRepo.update('123', {
  name: 'Jane Doe',
  status: 'inactive'
});
```

---

### 🗑️ Delete Operations

#### `delete(id: string): Promise<Dro>`

Permanently delete a record by ID.

**Parameters:**
- `id` - The unique identifier of the record to delete

**Returns:** The deleted record

**Example:**
```typescript
const deletedUser = await userRepo.delete('123');
```

---

#### `softDelete(id: string): Promise<Dro>`

Soft delete a record by setting its `deleted` flag to `true`.

**⚠️ Note:** Requires the model to have a `deleted` boolean field in the schema.

**Parameters:**
- `id` - The unique identifier of the record to soft delete

**Returns:** The updated record

**Example:**
```typescript
const deletedUser = await userRepo.softDelete('123');
// User is marked as deleted but still exists in database
```

---

## Batch Operations

### 📦 Bulk Create

#### `createMany(data: Dto[]): Promise<Dro>`

Create multiple records in a single database operation.

**Parameters:**
- `data` - Array of data objects to create

**Returns:** Batch operation result with count of created records

**Example:**
```typescript
const result = await userRepo.createMany([
  { email: 'user1@example.com', name: 'User 1' },
  { email: 'user2@example.com', name: 'User 2' },
  { email: 'user3@example.com', name: 'User 3' }
]);
console.log(`Created ${result.count} users`); // Created 3 users
```

**Features:**
- Automatically skips duplicate records
- Atomic operation (all or nothing)
- Significantly faster than individual creates

---

### 📝 Bulk Update

#### `updateMany(where: any, data: Partial<Dto>): Promise<Dro>`

Update multiple records that match the where condition.

**Parameters:**
- `where` - Condition to match records for update
- `data` - Partial data to update on all matching records

**Returns:** Batch operation result with count of updated records

**Example:**
```typescript
// Activate all pending users
const result = await userRepo.updateMany(
  { status: 'pending' },
  { status: 'active', activatedAt: new Date() }
);
console.log(`Activated ${result.count} users`);

// Update users by date range
const result2 = await userRepo.updateMany(
  { 
    createdAt: { 
      gte: new Date('2024-01-01'),
      lt: new Date('2024-02-01')
    }
  },
  { verified: true }
);
```

---

### 🗑️ Bulk Delete

#### `deleteMany(where: any): Promise<Dro>`

Permanently delete multiple records that match the where condition.

**Parameters:**
- `where` - Condition to match records for deletion

**Returns:** Batch operation result with count of deleted records

**Example:**
```typescript
// Delete inactive users from last year
const result = await userRepo.deleteMany({
  status: 'inactive',
  lastLoginAt: { lt: new Date('2024-01-01') }
});
console.log(`Deleted ${result.count} inactive users`);

// Delete all test users
const result2 = await userRepo.deleteMany({
  email: { endsWith: '@test.com' }
});
```

---

#### `softDeleteMany(ids: string[]): Promise<Dro>`

Soft delete multiple records by their IDs.

**⚠️ Note:** Requires the model to have a `deleted` boolean field in the schema.

**Parameters:**
- `ids` - Array of record IDs to soft delete

**Returns:** Batch operation result with count of soft-deleted records

**Example:**
```typescript
const result = await userRepo.softDeleteMany([
  'id1', 'id2', 'id3', 'id4', 'id5'
]);
console.log(`Soft deleted ${result.count} users`); // Soft deleted 5 users
```

---

## Utility Methods

### `toJSON(data: Dto): Dro | Record<string, any>`

Converts data to JSON format. Handles objects with custom `toJSON` methods.

**Parameters:**
- `data` - Data to convert

**Returns:** JSON representation of the data

**Usage:** Primarily used internally for serialization.

---

### `buildQueryFromParams(params: SearchParams): Record<string, any>`

Build Prisma query object from search parameters.

**Parameters:**
- `params` - Search parameters

**Returns:** Prisma-compatible query object

**Usage:** Internal method used by `search()` method.

---

## Usage Patterns

### Basic CRUD Pattern

```typescript
import { UserRepository } from '../repositories';

const userRepo = new UserRepository();

// Create
const user = await userRepo.create({ email: 'test@example.com' });

// Read
const foundUser = await userRepo.findById(user.id);
const allUsers = await userRepo.findMany();

// Update
const updated = await userRepo.update(user.id, { name: 'New Name' });

// Delete
await userRepo.delete(user.id);
```

---

### Batch Operations Pattern

```typescript
// Bulk create users
const users = await userRepo.createMany([
  { email: 'user1@example.com', name: 'User 1' },
  { email: 'user2@example.com', name: 'User 2' }
]);

// Bulk update
await userRepo.updateMany(
  { status: 'pending' },
  { status: 'active' }
);

// Bulk soft delete
await userRepo.softDeleteMany(['id1', 'id2', 'id3']);

// Bulk hard delete
await userRepo.deleteMany({ status: 'deleted' });
```

---

### Advanced Search Pattern

```typescript
const users = await userRepo.search({
  where: {
    AND: [
      { status: 'active' },
      { role: { in: ['admin', 'moderator'] } },
      { createdAt: { gte: new Date('2024-01-01') } }
    ]
  },
  orderBy: [
    { role: 'asc' },
    { createdAt: 'desc' }
  ],
  include: {
    profile: true,
    roles: true
  },
  take: 20,
  skip: 0
});
```

---

## Best Practices

### ✅ Do's

1. **Use batch operations for bulk data**
   ```typescript
   // Good - Single database call
   await repo.createMany(arrayOfData);
   
   // Bad - Multiple database calls
   for (const item of arrayOfData) {
     await repo.create(item);
   }
   ```

2. **Use soft delete when audit trail is needed**
   ```typescript
   // Preserves data for auditing
   await repo.softDelete(id);
   ```

3. **Use search() for complex queries**
   ```typescript
   await repo.search({
     where: complexConditions,
     include: relations,
     orderBy: sorting
   });
   ```

4. **Handle null returns from findById**
   ```typescript
   const user = await repo.findById(id);
   if (!user) {
     throw new Error('User not found');
   }
   ```

---

### ❌ Don'ts

1. **Don't use batch operations for small datasets**
   ```typescript
   // Bad - Overhead not worth it for 1-2 items
   await repo.createMany([singleItem]);
   
   // Good - Direct create is fine
   await repo.create(singleItem);
   ```

2. **Don't use hard delete if you need audit trail**
   ```typescript
   // Bad - Data permanently lost
   await repo.delete(id);
   
   // Good - Data preserved with deleted flag
   await repo.softDelete(id);
   ```

3. **Don't forget to add 'deleted' field for soft delete**
   ```prisma
   model User {
     id      String   @id @default(uuid())
     deleted Boolean  @default(false) // Required for soft delete
   }
   ```

---

## Performance Tips

### 1. Batch Operations
Use batch operations when working with multiple records:
- **createMany** is ~10x faster than multiple creates
- **updateMany** is ~5x faster than multiple updates
- **deleteMany** is ~5x faster than multiple deletes

### 2. Select Only Needed Fields
```typescript
const users = await repo.search({
  select: { id: true, email: true }, // Only fetch needed fields
  where: { status: 'active' }
});
```

### 3. Use Pagination
```typescript
const PAGE_SIZE = 50;
const users = await repo.search({
  take: PAGE_SIZE,
  skip: page * PAGE_SIZE
});
```

### 4. Avoid N+1 Queries
```typescript
// Bad - Multiple queries
const users = await repo.findMany();
for (const user of users) {
  const roles = await roleRepo.findMany({ userId: user.id });
}

// Good - Single query with include
const users = await repo.search({
  include: { roles: true }
});
```

---

## Schema Requirements

### Soft Delete Support

To use `softDelete()` and `softDeleteMany()`, your Prisma model must include:

```prisma
model User {
  id      String   @id @default(uuid())
  email   String   @unique
  deleted Boolean  @default(false) // Required field
  
  @@map("users")
}
```

### Recommended Fields

```prisma
model User {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deleted   Boolean  @default(false)
  
  // ... your fields
  
  @@map("users")
}
```

---

## Error Handling

```typescript
try {
  const user = await userRepo.findById(id);
  if (!user) {
    throw new Error('User not found');
  }
  // ... process user
} catch (error) {
  if (error.code === 'P2025') {
    // Prisma: Record not found
    console.error('Record not found');
  } else if (error.code === 'P2002') {
    // Prisma: Unique constraint violation
    console.error('Duplicate record');
  } else {
    console.error('Database error:', error);
  }
}
```

---

## Related Documentation

- [BaseInterface](../interfaces/base.interface.ts)
- [BaseService](../services/base.service.ts)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)

---

**Last Updated:** October 25, 2025  
**Maintainer:** Development Team
