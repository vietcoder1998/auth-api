# Database Seeder Refactoring Guide

## Overview

The seed file has been refactored from a single monolithic function into a **class-based, modular architecture** for better maintainability, testability, and scalability.

## 📁 New Structure

```
prisma/
├── seed.ts                    # Entry point (minimal)
├── seeders/
│   ├── database.seeder.ts     # Main seeder class
│   ├── agents.seeder.ts       # Agent-related seeding
│   ├── history.seeder.ts      # History seeding
│   ├── conversations.seeder.ts # Conversation seeding
│   ├── faqs.seeder.ts         # FAQ seeding
│   ├── jobs.seeder.ts         # Jobs seeding
│   └── ...                    # Other specialized seeders
└── mock/
    ├── aiPlatform.mock.ts     # AI Platform mock data
    ├── aiModel.mock.ts        # AI Model mock data
    ├── aiKey.mock.ts          # AI Key mock data
    ├── labels.mock.ts         # Labels mock data
    ├── tools.mock.ts          # Tools mock data
    ├── blog.mock.ts           # Blog & Category mock data
    ├── billing.mock.ts        # Billing mock data
    ├── permissions.mock.ts    # Permissions mock data
    ├── users.mock.ts          # Users mock data
    ├── configs.mock.ts        # Config mock data
    ├── sso.mock.ts            # SSO mock data
    ├── history.mock.ts        # History mock data
    ├── agents.mock.ts         # Agent mock data
    ├── conversations.mock.ts  # Conversation mock data
    ├── faqs.mock.ts           # FAQ mock data
    ├── prompts.mock.ts        # Prompts mock data
    └── jobs.mock.ts           # Jobs mock data
```

## 🎯 Key Benefits

### 1. **Modularity**
- Each entity type has its own seeding method
- Mock data separated into individual files
- Easy to locate and modify specific data

### 2. **Maintainability**
- Clear separation of concerns
- Each file is < 200 lines
- Easy to understand and navigate

### 3. **Reusability**
- Shared state management (users, roles, labels)
- Repository initialization in one place
- Common utilities available to all seeders

### 4. **Testability**
- Can test individual seeding methods
- Can mock prisma client for unit tests
- Can inject dependencies

### 5. **Scalability**
- Easy to add new entities
- Can extend with plugins/hooks
- Can run selective seeding

## 🔧 Implementation Plan

### Phase 1: Core Structure (Done ✅)
- [x] Create `DatabaseSeeder` class
- [x] Create `mock/*.mock.ts` files structure
- [x] Implement basic seeders (AI Platform, Models, Keys, etc.)

### Phase 2: Complex Seeders
- [ ] Extract agent seeding to `agents.seeder.ts`
- [ ] Extract history seeding to `history.seeder.ts`
- [ ] Extract conversation seeding to `conversations.seeder.ts`
- [ ] Extract FAQ seeding to `faqs.seeder.ts`

### Phase 3: Specialized Seeders
- [ ] Extract jobs seeding to `jobs.seeder.ts`
- [ ] Extract database connections to `database-connections.seeder.ts`
- [ ] Extract UI configs to `ui-configs.seeder.ts`
- [ ] Extract socket configs to `socket-configs.seeder.ts`

### Phase 4: Testing & Documentation
- [ ] Add unit tests for each seeder
- [ ] Add integration tests
- [ ] Document all mock data structures
- [ ] Create migration guide

## 📝 Usage Examples

### Running All Seeds
```typescript
import { DatabaseSeeder } from './seeders/database.seeder';

const seeder = new DatabaseSeeder();
await seeder.seed();
```

### Running Specific Seeds
```typescript
const seeder = new DatabaseSeeder();

// Seed only users and permissions
await seeder.seedPermissions();
await seeder.seedRoles();
await seeder.seedUsers();
```

### Custom Seeding
```typescript
class CustomSeeder extends DatabaseSeeder {
  async seedCustomData() {
    // Your custom seeding logic
  }

  async seed() {
    await super.seed();
    await this.seedCustomData();
  }
}
```

## 🏗️ Class Structure

### DatabaseSeeder

```typescript
class DatabaseSeeder {
  // Properties
  private prisma: PrismaClient;
  protected repositories: {...}
  protected mockLabelId?: string;
  protected userMapping: Record<string, any>;
  protected roleMapping: Record<string, string>;

  // Core Methods
  async seed(): Promise<void>
  async seedAIPlatforms(): Promise<void>
  async seedAIModels(): Promise<void>
  async seedAIKeys(): Promise<void>
  // ... 20+ more methods

  // Utilities
  async printSummary(): Promise<void>
}
```

## 📋 Migration Checklist

### For Each Entity Type:

1. **Create Mock File**
   ```typescript
   // prisma/mock/[entity].mock.ts
   export const mock[Entity]s = [
     // Your mock data
   ];
   ```

2. **Create Seeder Method**
   ```typescript
   async seed[Entity](): Promise<void> {
     console.log('🔹 Seeding [Entity]...');
     const { mock[Entity]s } = await import('../mock/[entity].mock');
     
     // Seeding logic using repository pattern
     
     console.log('✓ [Entity] seeded\n');
   }
   ```

3. **Add to Main Seed Flow**
   ```typescript
   async seed(): Promise<void> {
     // ... existing seeds
     await this.seed[Entity]();
   }
   ```

4. **Test**
   ```bash
   npm run seed
   ```

## 🔍 Code Examples

### Simple Entity (Labels)

**Mock File:** `prisma/mock/labels.mock.ts`
```typescript
export const mockLabels = [
  { name: 'mock', color: '#FF5733' },
  { name: 'test', color: '#33FF57' },
  { name: 'production', color: '#3357FF' },
];
```

**Seeder Method:** `seeders/database.seeder.ts`
```typescript
async seedLabels(): Promise<void> {
  console.log('🏷️ Seeding Labels...');
  const { mockLabels } = await import('../mock/labels.mock');
  
  const createdLabels = await this.labelRepo.upsertMany(
    mockLabels.map(label => ({
      where: { name: label.name },
      create: { name: label.name, color: label.color },
      update: { color: label.color },
    }))
  );
  
  // Store for later use
  const mockLabel = createdLabels.find((l: any) => l.name === 'mock');
  this.mockLabelId = mockLabel?.id;
  
  console.log('✓ Labels seeded\n');
}
```

### Complex Entity with Relations (Agents)

**Mock File:** `prisma/mock/agents.mock.ts`
```typescript
export const mockAgents = [
  {
    id: 'agent-001',
    name: 'General Assistant',
    description: 'A helpful AI assistant',
    ownerId: 'super-admin-id', // Reference to user
    model: 'gpt-4', // Reference to model
    isActive: true,
    // ... more fields
  },
  // ... more agents
];
```

**Seeder Method:** `seeders/agents.seeder.ts`
```typescript
async seedAgents(): Promise<void> {
  console.log('🤖 Seeding AI Agents...');
  const { mockAgents } = await import('../mock/agents.mock');
  
  const superadminUser = this.userMapping['superadmin@example.com'];
  const adminUser = this.userMapping['admin@example.com'];
  
  const agentUserMapping: Record<string, string> = {
    'super-admin-id': superadminUser?.id || '',
    'admin-id': adminUser?.id || '',
  };
  
  const createdAgents: any[] = [];
  
  for (const agent of mockAgents) {
    const model = await this.prisma.aIModel.findUnique({
      where: { name: agent.model }
    });
    
    const agentData = {
      name: agent.name,
      description: agent.description,
      userId: agentUserMapping[agent.ownerId],
      modelId: model?.id,
      isActive: agent.isActive,
    };
    
    const created = await this.agentRepo.create(agentData);
    createdAgents.push(created);
  }
  
  this.agentMapping['created'] = createdAgents;
  console.log(`✓ Created ${createdAgents.length} agents\n`);
}
```

## 🎨 Best Practices

### 1. **Naming Conventions**
- Mock files: `[entity].mock.ts` (camelCase)
- Seeder methods: `seed[Entity]()` (PascalCase)
- Exported arrays: `mock[Entity]s` (plural)

### 2. **State Management**
```typescript
// Store created entities for later use
this.userMapping[user.email] = user;
this.roleMapping[role.name] = role.id;
this.agentMapping['created'] = agents;
```

### 3. **Error Handling**
```typescript
async seedEntity(): Promise<void> {
  try {
    console.log('🔹 Seeding Entity...');
    // Seeding logic
    console.log('✓ Entity seeded\n');
  } catch (error) {
    console.error('❌ Error seeding Entity:', error);
    throw error;
  }
}
```

### 4. **Logging**
```typescript
// Start
console.log('🔹 Seeding Entity...');

// Progress
console.log(`  - Created ${count} items`);

// Warning
console.warn(`⚠️ Skipping item (reason)`);

// Success
console.log('✓ Entity seeded\n');
```

### 5. **Dependencies**
```typescript
async seed(): Promise<void> {
  // Seed in dependency order
  await this.seedLabels();      // No dependencies
  await this.seedUsers();       // Depends on roles
  await this.seedAgents();      // Depends on users, models
  await this.seedConversations(); // Depends on agents, users
}
```

## 📊 Performance Comparison

| Approach | Lines of Code | Maintainability | Performance |
|----------|---------------|-----------------|-------------|
| **Old (Monolithic)** | 1396 lines | ⭐⭐ | ⭐⭐⭐ |
| **New (Modular)** | ~200 lines/file | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

## 🚀 Next Steps

1. **Create remaining mock files**
   - Copy existing mock data from `src/mock/` to `prisma/mock/`
   - Convert to TypeScript with proper types

2. **Implement specialized seeders**
   - Extract complex seeding logic to dedicated files
   - Implement as mixins or base classes

3. **Add selective seeding**
   ```typescript
   const seeder = new DatabaseSeeder();
   await seeder.seedOnly(['users', 'agents', 'conversations']);
   ```

4. **Add rollback capability**
   ```typescript
   await seeder.rollback(); // Clear all seeded data
   ```

5. **Add seeding profiles**
   ```typescript
   await seeder.seed({ profile: 'minimal' }); // Only core data
   await seeder.seed({ profile: 'full' });    // All data
   ```

## 📖 Additional Resources

- [Prisma Seeding Guide](https://www.prisma.io/docs/guides/database/seed-database)
- [Repository Pattern Documentation](../docs/BASE_REPOSITORY_API.md)
- [Service Layer Documentation](../docs/BASE_SERVICE_API.md)

---

**Status**: 🚧 Phase 1 Complete - Migration in Progress
**Last Updated**: October 25, 2025
**Next Milestone**: Complete Phase 2 (Complex Seeders)
