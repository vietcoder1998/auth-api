# BaseService API Documentation

**File:** `src/services/base.service.ts`  
**Last Updated:** October 25, 2025

---

## Overview

The `BaseService` class is a generic service layer pattern implementation that provides common business logic operations and delegates to the repository layer for data access. All entity-specific services extend this base class to maintain consistent architecture across the application.

---

## Class Signature

```typescript
export class BaseService<T, Dto, Dro>
```

### Type Parameters

- **T** - The Prisma model delegate type (e.g., `PrismaClient['user']`)
- **Dto** - Data Transfer Object type for input operations (create, update)
- **Dro** - Data Response Object type for output operations (read)

---

## Architecture

```
┌─────────────────────────────────────────────┐
│            Controller Layer                  │
│         (HTTP Request Handling)              │
└─────────────────┬───────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────┐
│          Service Layer ← BaseService        │
│         (Business Logic)                     │
└─────────────────┬───────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────┐
│       Repository Layer ← BaseRepository     │
│         (Data Access)                        │
└─────────────────┬───────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────┐
│          Prisma ORM → Database              │
└─────────────────────────────────────────────┘
```

---

## Constructor

```typescript
constructor(repository: BaseRepository<T, Dto, Dro>)
```

Creates a new service instance with dependency injection of repository.

**Parameters:**
- `repository` - Repository instance for data access operations

**Example:**
```typescript
export class UserService extends BaseService<UserModel, UserDto, UserDto> {
  constructor() {
    const userRepository = new UserRepository();
    super(userRepository);
  }
  
  // Add custom business logic methods
  async activateUser(userId: string) {
    return this.update(userId, { status: 'active' });
  }
}
```

---

## Core Methods

### 📖 Read Operations

#### `findAll(): Promise<Dro[]>`

Find all records in the database.

**Returns:** Array of all records

**Example:**
```typescript
const allUsers = await userService.findAll();
console.log(`Total users: ${allUsers.length}`);
```

**Use Cases:**
- Admin dashboards showing all entities
- Dropdown/select options
- Export functionality

**⚠️ Warning:** Use with caution on large datasets. Consider using `findMany()` with filters for better performance.

---

#### `findOne(id: string): Promise<Dro | null>`

Find a single record by its unique identifier.

**Parameters:**
- `id` - The unique identifier of the record

**Returns:** The found record or `null` if not found

**Example:**
```typescript
const user = await userService.findOne('user-uuid-123');
if (!user) {
  throw new Error('User not found');
}
console.log(user.email);
```

**Best Practice:**
```typescript
// Always handle null case
const user = await userService.findOne(userId);
if (!user) {
  return res.status(404).json({ error: 'User not found' });
}
// Continue with found user
```

---

#### `findMany(where?: Record<string, any>): Promise<Dro[]>`

Find multiple records with optional filtering using Prisma WhereInput.

**Parameters:**
- `where` - Optional filter condition (Prisma WhereInput syntax)

**Returns:** Array of matching records

**Examples:**

**Basic Filtering:**
```typescript
// Find all active users
const activeUsers = await userService.findMany({ status: 'active' });

// Find all records (same as findAll)
const allUsers = await userService.findMany();
```

**Complex Filtering:**
```typescript
// AND conditions
const users = await userService.findMany({
  AND: [
    { status: 'active' },
    { role: { in: ['admin', 'moderator'] } },
    { verified: true }
  ]
});

// OR conditions
const users = await userService.findMany({
  OR: [
    { email: { contains: '@admin.com' } },
    { role: 'admin' }
  ]
});

// Date range filtering
const recentUsers = await userService.findMany({
  createdAt: {
    gte: new Date('2024-01-01'),
    lt: new Date('2024-12-31')
  }
});

// Nested filtering
const users = await userService.findMany({
  profile: {
    country: 'USA',
    verified: true
  }
});
```

**Advanced Operators:**
```typescript
// String operations
const users = await userService.findMany({
  email: {
    contains: 'gmail',      // Contains substring
    startsWith: 'admin',    // Starts with
    endsWith: '@test.com',  // Ends with
    not: 'banned@email.com' // Not equal
  }
});

// Numeric comparisons
const users = await userService.findMany({
  age: {
    gte: 18,  // Greater than or equal
    lte: 65,  // Less than or equal
    gt: 17,   // Greater than
    lt: 66    // Less than
  }
});

// Array operations
const users = await userService.findMany({
  role: {
    in: ['admin', 'moderator', 'editor'],     // In array
    notIn: ['banned', 'suspended']            // Not in array
  }
});

// Null checks
const users = await userService.findMany({
  deletedAt: null,              // Is null
  profileImage: { not: null }   // Is not null
});
```

---

### ✏️ Write Operations

#### `create(data: Dto): Promise<Dro>`

Create a new record with validation and business logic.

**Parameters:**
- `data` - Complete data object for creating the record

**Returns:** The created record with generated ID and timestamps

**Example:**
```typescript
const newUser = await userService.create({
  email: 'user@example.com',
  name: 'John Doe',
  status: 'active',
  role: 'user'
});

console.log(`User created with ID: ${newUser.id}`);
```

**With Validation:**
```typescript
// In your service class
async createUser(data: CreateUserDto) {
  // Business logic validation
  if (!this.isValidEmail(data.email)) {
    throw new Error('Invalid email format');
  }
  
  // Check for duplicates
  const existing = await this.findMany({ email: data.email });
  if (existing.length > 0) {
    throw new Error('Email already exists');
  }
  
  // Create with additional processing
  return this.create({
    ...data,
    createdAt: new Date(),
    emailVerified: false
  });
}
```

---

#### `update(id: string, data: Partial<Dto>): Promise<Dro | null>`

Update an existing record with partial data.

**Parameters:**
- `id` - The unique identifier of the record to update
- `data` - Partial data object (only fields to update)

**Returns:** The updated record or `null` if not found

**Example:**
```typescript
const updated = await userService.update('user-123', {
  name: 'Jane Doe',
  status: 'inactive'
});

if (updated) {
  console.log('User updated successfully');
}
```

**With Business Logic:**
```typescript
async updateUserStatus(userId: string, newStatus: string) {
  const user = await this.findOne(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Validate status transition
  if (!this.isValidStatusTransition(user.status, newStatus)) {
    throw new Error('Invalid status transition');
  }
  
  return this.update(userId, {
    status: newStatus,
    statusChangedAt: new Date()
  });
}
```

---

### 🗑️ Delete Operations

#### `delete(id: string): Promise<Dro>`

Permanently delete a record from the database.

**Parameters:**
- `id` - The unique identifier of the record to delete

**Returns:** The deleted record

**Example:**
```typescript
const deleted = await userService.delete('user-123');
console.log(`Deleted user: ${deleted.email}`);
```

**⚠️ Warning:** This is a hard delete. Data cannot be recovered. Consider using `softDelete()` for audit trails.

**With Cascade Check:**
```typescript
async deleteUser(userId: string) {
  // Check for dependent records
  const orders = await orderService.findMany({ userId });
  if (orders.length > 0) {
    throw new Error('Cannot delete user with existing orders');
  }
  
  return this.delete(userId);
}
```

---

#### `softDelete(id: string): Promise<Dro>`

Soft delete a record by marking it as deleted (sets `deleted` flag to `true`).

**Parameters:**
- `id` - The unique identifier of the record to soft delete

**Returns:** The updated record with deleted flag set

**⚠️ Schema Requirement:** Model must have a `deleted: Boolean` field.

**Example:**
```typescript
const deleted = await userService.softDelete('user-123');
// User record still exists but marked as deleted
```

**Schema Setup:**
```prisma
model User {
  id      String   @id @default(uuid())
  email   String   @unique
  deleted Boolean  @default(false)  // Required for soft delete
  
  @@map("users")
}
```

**With Audit:**
```typescript
async softDeleteUser(userId: string, reason: string) {
  // Log deletion
  await auditService.create({
    action: 'soft_delete',
    entityType: 'user',
    entityId: userId,
    reason
  });
  
  return this.softDelete(userId);
}
```

---

## Batch Operations

### 📦 `createMany(data: Dto[]): Promise<{ count: number }>`

Create multiple records in a single database transaction.

**Parameters:**
- `data` - Array of data objects to create

**Returns:** Object with count of successfully created records

**Example:**
```typescript
const result = await userService.createMany([
  { email: 'user1@example.com', name: 'User 1' },
  { email: 'user2@example.com', name: 'User 2' },
  { email: 'user3@example.com', name: 'User 3' }
]);

console.log(`Created ${result.count} users`); // Created 3 users
```

**Performance Benefits:**
- ~10x faster than individual creates
- Single database round-trip
- Atomic operation (all or nothing in transaction)

**Import from CSV:**
```typescript
async importUsersFromCSV(csvData: string) {
  const users = this.parseCSV(csvData);
  
  // Validate all records first
  for (const user of users) {
    if (!this.isValid(user)) {
      throw new Error(`Invalid user data: ${user.email}`);
    }
  }
  
  // Bulk create
  const result = await this.createMany(users);
  return {
    imported: result.count,
    total: users.length
  };
}
```

---

### 📝 `updateMany(where: Record<string, any>, data: Partial<Dto>): Promise<{ count: number }>`

Update multiple records that match the filter condition.

**Parameters:**
- `where` - Filter condition using Prisma WhereInput syntax
- `data` - Partial data to apply to all matching records

**Returns:** Object with count of updated records

**Examples:**

**Simple Update:**
```typescript
// Activate all pending users
const result = await userService.updateMany(
  { status: 'pending' },
  { status: 'active', activatedAt: new Date() }
);

console.log(`Activated ${result.count} users`);
```

**Date-Based Update:**
```typescript
// Mark old unverified users as expired
const result = await userService.updateMany(
  {
    verified: false,
    createdAt: {
      lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    }
  },
  { status: 'expired' }
);
```

**Role-Based Update:**
```typescript
// Give premium features to all moderators
const result = await userService.updateMany(
  { role: { in: ['moderator', 'admin'] } },
  { premiumFeatures: true }
);
```

---

### 🗑️ `deleteMany(where: Record<string, any>): Promise<{ count: number }>`

Permanently delete multiple records that match the filter condition.

**Parameters:**
- `where` - Filter condition using Prisma WhereInput syntax

**Returns:** Object with count of deleted records

**Examples:**

**Delete Inactive Users:**
```typescript
const result = await userService.deleteMany({
  status: 'inactive',
  lastLoginAt: {
    lt: new Date('2024-01-01')
  }
});

console.log(`Deleted ${result.count} inactive users`);
```

**Delete Test Data:**
```typescript
// Clean up test users
const result = await userService.deleteMany({
  email: { endsWith: '@test.com' }
});
```

**Delete by Multiple Criteria:**
```typescript
const result = await userService.deleteMany({
  AND: [
    { verified: false },
    { createdAt: { lt: oneMonthAgo } },
    { loginCount: 0 }
  ]
});
```

**⚠️ Warning:** This is permanent. Cannot be undone. Use with extreme caution in production.

---

### 🗑️ `softDeleteMany(ids: string[]): Promise<{ count: number }>`

Soft delete multiple records by their IDs.

**Parameters:**
- `ids` - Array of record IDs to soft delete

**Returns:** Object with count of soft-deleted records

**⚠️ Schema Requirement:** Model must have a `deleted: Boolean` field.

**Example:**
```typescript
const userIds = ['id1', 'id2', 'id3', 'id4', 'id5'];
const result = await userService.softDeleteMany(userIds);

console.log(`Soft deleted ${result.count} users`);
```

**Bulk Cleanup:**
```typescript
// Soft delete multiple users at once
async bulkSoftDeleteUsers(userIds: string[], reason: string) {
  // Log the action
  await auditService.create({
    action: 'bulk_soft_delete',
    entityType: 'user',
    entityIds: userIds,
    reason
  });
  
  return this.softDeleteMany(userIds);
}
```

---

## Usage Patterns

### Basic Service Implementation

```typescript
import { BaseService } from './base.service';
import { UserRepository } from '../repositories';
import { UserModel, UserDto } from '../interfaces';

export class UserService extends BaseService<UserModel, UserDto, UserDto> {
  constructor() {
    const userRepository = new UserRepository();
    super(userRepository);
  }
  
  // Custom business logic methods
  async activateUser(userId: string) {
    const user = await this.findOne(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.status === 'banned') {
      throw new Error('Cannot activate banned user');
    }
    
    return this.update(userId, {
      status: 'active',
      activatedAt: new Date()
    });
  }
  
  async findActiveAdmins() {
    return this.findMany({
      status: 'active',
      role: 'admin'
    });
  }
}

export const userService = new UserService();
```

---

### Controller Integration

```typescript
import { userService } from '../services';

export class UserController {
  // GET /users
  async getAll(req: Request, res: Response) {
    try {
      const users = await userService.findAll();
      res.json({ data: users, total: users.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // GET /users/:id
  async getOne(req: Request, res: Response) {
    try {
      const user = await userService.findOne(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ data: user });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // POST /users
  async create(req: Request, res: Response) {
    try {
      const user = await userService.create(req.body);
      res.status(201).json({ data: user });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  
  // PATCH /users/:id
  async update(req: Request, res: Response) {
    try {
      const user = await userService.update(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ data: user });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  
  // DELETE /users/:id
  async delete(req: Request, res: Response) {
    try {
      await userService.softDelete(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

---

### Advanced Business Logic

```typescript
export class UserService extends BaseService<UserModel, UserDto, UserDto> {
  // ... constructor
  
  async registerUser(data: RegisterDto) {
    // Validation
    if (!this.isValidEmail(data.email)) {
      throw new Error('Invalid email');
    }
    
    // Check duplicates
    const existing = await this.findMany({ email: data.email });
    if (existing.length > 0) {
      throw new Error('Email already registered');
    }
    
    // Hash password
    const hashedPassword = await this.hashPassword(data.password);
    
    // Create user
    const user = await this.create({
      ...data,
      password: hashedPassword,
      status: 'pending',
      emailVerified: false
    });
    
    // Send verification email
    await emailService.sendVerificationEmail(user.email);
    
    return user;
  }
  
  async verifyEmail(userId: string, token: string) {
    const user = await this.findOne(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.emailVerified) {
      throw new Error('Email already verified');
    }
    
    // Verify token
    if (!this.isValidVerificationToken(token, user)) {
      throw new Error('Invalid verification token');
    }
    
    return this.update(userId, {
      emailVerified: true,
      status: 'active',
      emailVerifiedAt: new Date()
    });
  }
  
  async bulkImportUsers(users: ImportUserDto[]) {
    // Validate all
    const validationErrors = [];
    for (const user of users) {
      const errors = this.validateUser(user);
      if (errors.length > 0) {
        validationErrors.push({ user, errors });
      }
    }
    
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.length} users`);
    }
    
    // Transform data
    const transformedUsers = users.map(user => ({
      ...user,
      status: 'active',
      createdAt: new Date()
    }));
    
    // Bulk create
    const result = await this.createMany(transformedUsers);
    
    // Log import
    await auditService.create({
      action: 'bulk_import_users',
      count: result.count
    });
    
    return result;
  }
}
```

---

## Best Practices

### ✅ Do's

**1. Always Handle Null Returns**
```typescript
const user = await userService.findOne(id);
if (!user) {
  throw new Error('User not found');
}
// Safe to use user here
```

**2. Use Batch Operations for Multiple Records**
```typescript
// Good - Single query
await userService.createMany(users);

// Bad - Multiple queries
for (const user of users) {
  await userService.create(user);
}
```

**3. Add Business Logic in Service Layer**
```typescript
class UserService extends BaseService<...> {
  async activateUser(userId: string) {
    // Business rules here
    const user = await this.findOne(userId);
    if (user.status === 'banned') {
      throw new Error('Cannot activate banned user');
    }
    return this.update(userId, { status: 'active' });
  }
}
```

**4. Use Soft Delete for Audit Trail**
```typescript
// Preserves data for auditing
await userService.softDelete(id);
```

---

### ❌ Don'ts

**1. Don't Bypass Service Layer**
```typescript
// Bad - Direct repository access from controller
const users = await userRepository.findAll();

// Good - Use service layer
const users = await userService.findAll();
```

**2. Don't Put Business Logic in Controllers**
```typescript
// Bad
async createUser(req, res) {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const user = await userService.create({ ...req.body, password: hashedPassword });
  await emailService.sendWelcome(user.email);
}

// Good - Move to service
async createUser(req, res) {
  const user = await userService.registerUser(req.body);
}
```

**3. Don't Use findAll() on Large Tables**
```typescript
// Bad - Loads everything
const users = await userService.findAll();

// Good - Use filtering
const users = await userService.findMany({ status: 'active' });
```

---

## Performance Tips

### 1. Use Batch Operations

```typescript
// 10x faster
await userService.createMany(users);

// vs individual creates
for (const user of users) {
  await userService.create(user);
}
```

### 2. Filter Data Early

```typescript
// Good - Filter at database
const activeUsers = await userService.findMany({ status: 'active' });

// Bad - Filter in JavaScript
const allUsers = await userService.findAll();
const activeUsers = allUsers.filter(u => u.status === 'active');
```

### 3. Use Soft Delete for Frequently Deleted Data

```typescript
// Faster - UPDATE operation
await userService.softDelete(id);

// Slower - DELETE + cascade operations
await userService.delete(id);
```

---

## Error Handling

```typescript
try {
  const user = await userService.create(userData);
} catch (error) {
  if (error.code === 'P2002') {
    // Unique constraint violation
    console.error('Duplicate email');
  } else if (error.code === 'P2025') {
    // Record not found
    console.error('User not found');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

---

## Type Safety

```typescript
// Full type checking
interface UserDto {
  email: string;
  name: string;
  status: 'active' | 'inactive';
}

class UserService extends BaseService<UserModel, UserDto, UserDto> {
  async create(data: UserDto) {  // TypeScript enforces UserDto structure
    return super.create(data);
  }
}
```

---

## Related Documentation

- [BaseRepository API](./BASE_REPOSITORY_API.md)
- [BaseInterface](../interfaces/base.interface.ts)
- [Prisma WhereInput](https://www.prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting)

---

**Last Updated:** October 25, 2025  
**Maintainer:** Development Team
