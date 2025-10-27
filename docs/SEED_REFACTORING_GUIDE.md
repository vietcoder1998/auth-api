# Seed File Refactoring Guide

## Overview

This document provides guidance on refactoring the `prisma/seed.ts` file to use repositories instead of direct Prisma calls, following the repository pattern established throughout the codebase.

## Current Status

The seed file currently uses direct Prisma client calls like:
- `prisma.user.create()`
- `prisma.agent.upsert()`
- `prisma.label.findUnique()`

## Target Pattern

All seeding operations should use repositories:
- `userRepo.create()`
- `agentRepo.findById()` + conditional create/update
- `labelRepo.findByName()`

## Repository Methods Available

From `BaseRepository`, all repositories have these methods:

### Read Operations
- `findById(id: string)` - Find single record by ID
- `search(params: SearchParams)` - Search with filters, returns array
- `search({})` - Get all records (equivalent to findAll)

### Write Operations
- `create(data: Dto)` - Create single record
- `update(id: string, data: Partial<Dto>)` - Update single record
- `delete(id: string)` - Delete single record
- `softDelete(id: string)` - Soft delete (requires deleted field)

### Batch Operations
- `createMany(data: Dto[])` - Create multiple records
- `updateMany(where: Record<string, any>, data: Partial<Dto>)` - Update multiple
- `deleteMany(where: Record<string, any>)` - Delete multiple
- `findMany(where?: Record<string, any>)` - Find multiple with filter

## Refactoring Steps

### 1. Import Repositories

```typescript
import {
  UserRepository,
  RoleRepository,
  PermissionRepository,
  AgentRepository,
  LabelRepository,
  // ... all other repositories
} from '../src/repositories';
```

### 2. Initialize Repository Instances

```typescript
const userRepo = new UserRepository();
const roleRepo = new RoleRepository();
const permissionRepo = new PermissionRepository();
// ... etc
```

### 3. Replace Prisma Calls

#### Before (upsert pattern):
```typescript
await prisma.user.upsert({
  where: { email: user.email },
  update: {},
  create: {
    email: user.email,
    password: user.password,
    nickname: user.nickname,
  },
});
```

#### After (repository pattern):
```typescript
const existing = await userRepo.search({ where: { email: user.email } });
if (existing.length === 0) {
  await userRepo.create({
    email: user.email,
    password: user.password,
    nickname: user.nickname,
  });
}
```

#### Alternative (simpler for ID-based upsert):
```typescript
const existing = await userRepo.findById(user.id);
if (!existing) {
  await userRepo.create(user);
} else {
  await userRepo.update(user.id, user);
}
```

### 4. Replace findUnique/findFirst

#### Before:
```typescript
const user = await prisma.user.findUnique({
  where: { email: 'admin@example.com' }
});
```

#### After:
```typescript
const users = await userRepo.search({ 
  where: { email: 'admin@example.com' }
});
const user = users[0] || null;
```

### 5. Replace findMany

#### Before:
```typescript
const allUsers = await prisma.user.findMany();
```

#### After:
```typescript
const allUsers = await userRepo.search({});
```

### 6. Replace createMany

#### Before:
```typescript
await prisma.entityLabel.createMany({
  data: labels,
  skipDuplicates: true,
});
```

#### After:
```typescript
await entityLabelRepo.createMany(labels);
```

## Special Cases

### 1. Custom Repository Methods

Some repositories have custom methods (e.g., `labelRepo.findByName()`). Use these when available:

```typescript
// Instead of:
const labels = await labelRepo.search({ where: { name: 'mock' } });
const label = labels[0];

// Use:
const label = await labelRepo.findByName('mock');
```

### 2. Relations and Includes

When you need to include relations, use the search method with include:

```typescript
const agents = await agentRepo.search({
  where: { userId: user.id },
  include: {
    user: { select: { email: true, nickname: true } },
    model: true,
  }
});
```

### 3. Complex Queries

For very complex queries that repositories don't support well, you can still use Prisma directly, but this should be minimized:

```typescript
// OK for very complex operations
const result = await prisma.$transaction([
  // complex multi-step operation
]);
```

## Benefits

1. **Consistency**: Same pattern used throughout codebase
2. **Type Safety**: Better TypeScript support
3. **Maintainability**: Single source of truth for data access
4. **Testability**: Easier to mock repositories
5. **Abstraction**: Database implementation details hidden

## Example: Complete Refactoring

### Before:
```typescript
async function seedUsers() {
  for (const user of mockUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        password: user.password,
        nickname: user.nickname,
        roleId: roleMapping[user.roleName],
      },
    });
  }
}
```

### After:
```typescript
async function seedUsers() {
  for (const user of mockUsers) {
    const existing = await userRepo.search({ 
      where: { email: user.email } 
    });
    
    if (existing.length === 0) {
      await userRepo.create({
        email: user.email,
        password: user.password,
        nickname: user.nickname,
        roleId: roleMapping[user.roleName],
      });
    }
  }
}
```

## Migration Checklist

- [ ] Import all required repositories
- [ ] Initialize repository instances
- [ ] Replace all `prisma.*.create()` with `repo.create()`
- [ ] Replace all `prisma.*.update()` with `repo.update()`
- [ ] Replace all `prisma.*.delete()` with `repo.delete()`
- [ ] Replace all `prisma.*.findUnique()` with `repo.findById()` or `repo.search()`
- [ ] Replace all `prisma.*.findFirst()` with `repo.search()`
- [ ] Replace all `prisma.*.findMany()` with `repo.search()`
- [ ] Replace all `prisma.*.upsert()` with conditional create/update
- [ ] Replace all `prisma.*.createMany()` with `repo.createMany()`
- [ ] Replace all `prisma.*.updateMany()` with `repo.updateMany()`
- [ ] Replace all `prisma.*.deleteMany()` with `repo.deleteMany()`
- [ ] Test seeding with `npx prisma db seed`
- [ ] Verify all data is created correctly

## Notes

- The BaseRepository uses `search({})` to get all records, not a `findAll()` method
- Always handle potential null/undefined returns from `findById()`
- Use type assertions when needed: `await repo.search<UserModel>({})`
- Keep the Prisma client for very complex operations or transactions

## Next Steps

1. Create a backup of current seed.ts
2. Refactor section by section
3. Test each section after refactoring
4. Update documentation with any new patterns discovered
5. Consider creating helper functions for common seeding patterns

---

**Created:** October 25, 2025  
**Status:** Guide Complete  
**Related:** FINAL_REFACTORING_COMPLETE.md, BASE_REPOSITORY_API.md
