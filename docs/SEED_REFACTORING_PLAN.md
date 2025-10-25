# Seed File Repository Refactoring - Action Plan

## Current Situation

The `prisma/seed.ts` file contains **1300+ lines** of seeding code using direct Prisma client calls. Due to its size and complexity, a complete immediate refactoring would be risky and error-prone.

## Recommended Approach: Phased Migration

### Phase 1: Setup & Simple Entities ✅ (Already Started)

**Files Modified:**
- Added repository imports to seed.ts
- Initialized repository instances

**Entities to Refactor:**
1. ✅ AI Platforms - Simple entity
2. ✅ AI Models - Simple entity with relation
3. ✅ AI Keys - Simple entity with validation
4. ✅ Labels - Simple entity with upsert logic

**Status:** Partially complete

### Phase 2: Core Entities (Recommended Next)

**Entities:**
1. Categories
2. Blogs
3. Billings
4. Config
5. Mail Templates
6. Notification Templates

**Complexity:** Low - mostly simple create operations

**Estimated Effort:** 30 minutes

### Phase 3: User & Permission System

**Entities:**
1. Permissions
2. Roles (with permission relations)
3. Users (with role relations)

**Complexity:** Medium - has relationships and role mappings

**Estimated Effort:** 45 minutes

###  Phase 4: SSO & History

**Entities:**
1. SSO Entries
2. Login History
3. Logic History

**Complexity:** Medium - requires user ID mappings

**Estimated Effort:** 30 minutes

### Phase 5: AI Agents & Related

**Entities:**
1. Agents (with model relations)
2. Agent Memories
3. Agent Tasks
4. Agent Tools
5. Tools (global)

**Complexity:** High - complex relationships and status tracking

**Estimated Effort:** 1 hour

### Phase 6: Conversations & Messages

**Entities:**
1. Conversations (with agent/user relations)
2. Messages (with conversation relations)
3. FAQs (with conversation/message relations)
4. Prompt History

**Complexity:** High - deeply nested data structures

**Estimated Effort:** 1.5 hours

### Phase 7: Additional Entities

**Entities:**
1. Jobs
2. Database Connections
3. UI Configs
4. Socket Configs
5. Socket Events

**Complexity:** Low-Medium

**Estimated Effort:** 30 minutes

### Phase 8: Entity Labels (All Entities)

**Task:** Refactor all entity label creations across all entities

**Complexity:** Medium - repetitive but needs careful tracking

**Estimated Effort:** 45 minutes

## Current Code Pattern vs. Target Pattern

### Pattern 1: Upsert (Most Common)

#### Current:
```typescript
await prisma.user.upsert({
  where: { email: user.email },
  update: {},
  create: { ...user },
});
```

#### Target:
```typescript
const existing = await userRepo.search({ where: { email: user.email } });
if (existing.length === 0) {
  await userRepo.create({ ...user });
}
```

### Pattern 2: Create with Duplicate Check

#### Current:
```typescript
const existingAgent = await prisma.agent.findFirst({
  where: { userId: agent.userId, name: agent.name },
});
if (!existingAgent) {
  await prisma.agent.create({ data: agent });
}
```

#### Target:
```typescript
const existing = await agentRepo.search({
  where: { userId: agent.userId, name: agent.name },
});
if (existing.length === 0) {
  await agentRepo.create(agent);
}
```

### Pattern 3: CreateMany

#### Current:
```typescript
await prisma.entityLabel.createMany({
  data: labels,
  skipDuplicates: true,
});
```

#### Target:
```typescript
await entityLabelRepo.createMany(labels);
```

### Pattern 4: Update

#### Current:
```typescript
await prisma.agent.update({
  where: { id: agent.id },
  data: { model: { connect: { id: modelId } } },
});
```

#### Target:
```typescript
await agentRepo.update(agent.id, { modelId });
```

## Quick Wins (High Impact, Low Effort)

These changes provide immediate benefits with minimal risk:

1. **CreateMany operations** - Simple 1:1 replacement
   - EntityLabel.createMany → entityLabelRepo.createMany
   - All bulk inserts

2. **Simple upserts** - Categories, Blogs, Configs
   - Low risk, straightforward logic

3. **Update operations** - Model assignments
   - Direct replacements

## Risks & Mitigation

### Risk 1: Breaking Existing Seed Logic
**Mitigation:** 
- Test after each phase
- Keep backup of original file
- Run `npx prisma db seed` after each change

### Risk 2: Missing Repository Methods
**Mitigation:**
- Document any Prisma calls that can't be replaced
- Add custom methods to repositories if needed
- Keep complex queries using Prisma directly

### Risk 3: Performance Degradation
**Mitigation:**
- Monitor seeding time before/after
- Use batch operations where possible
- Keep transaction logic intact

## Testing Strategy

After each phase:

```bash
# 1. Reset database
npx prisma migrate reset --force

# 2. Run seeding
npx prisma db seed

# 3. Verify data
npx prisma studio

# 4. Check counts
# Verify all expected records were created
```

## Rollback Plan

If issues occur:

```bash
# 1. Restore from backup
cp prisma/seed.ts.backup prisma/seed.ts

# 2. Reset and reseed
npx prisma migrate reset --force
npx prisma db seed
```

## Progress Tracking

### Completed:
- ✅ Repository imports added
- ✅ Repository instances initialized
- ✅ AI Platforms refactored
- ✅ AI Models refactored
- ✅ AI Keys refactored
- ✅ Labels refactored

### In Progress:
- 🔄 Categories
- 🔄 Blogs
- 🔄 Billings

### Not Started:
- ⏸️ Permissions
- ⏸️ Roles
- ⏸️ Users
- ⏸️ SSO
- ⏸️ History
- ⏸️ Agents
- ⏸️ Conversations
- ⏸️ Messages
- ⏸️ FAQs
- ⏸️ And others...

## Recommendation

**Option 1: Full Refactoring (4-5 hours total)**
- Complete all phases systematically
- Highest consistency and code quality
- Recommended for production readiness

**Option 2: Hybrid Approach (1-2 hours)**
- Refactor simple entities only (Phases 1-4)
- Keep complex entities with Prisma for now
- Good balance of improvement vs. time
- **RECOMMENDED FOR NOW**

**Option 3: Minimal Changes (30 minutes)**
- Only refactor what's already started
- Document remaining work
- Defer to future sprint

## Next Steps

1. **Decide on approach** (Option 1, 2, or 3)
2. **Create backup** of seed.ts
3. **Proceed with selected phases**
4. **Test thoroughly** after each phase
5. **Document any issues** encountered
6. **Update this plan** with actual progress

## Files to Create

- [ ] `prisma/seed.ts.backup` - Backup before refactoring
- [x] `docs/SEED_REFACTORING_GUIDE.md` - Detailed guide
- [x] `docs/SEED_REFACTORING_PLAN.md` - This file

## Conclusion

The seed file refactoring is a significant undertaking due to the file's size and complexity. A phased approach is recommended to minimize risk while achieving the goal of consistent repository usage throughout the codebase.

**Current Status:** Phase 1 partially complete (~5% done)  
**Recommended:** Proceed with Phase 2-4 for 80/20 benefit  
**Time Estimate:** 2-3 hours for recommended approach  

---

**Created:** October 25, 2025  
**Author:** GitHub Copilot  
**Related:** SEED_REFACTORING_GUIDE.md, FINAL_REFACTORING_COMPLETE.md
