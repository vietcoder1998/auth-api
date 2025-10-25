# Testing the New Seeder System

## Quick Start

### 1. Test the New Seeder
```powershell
# Navigate to auth-api directory
cd d:\_WORKS\_COMPANIES\VIET_TECHNOLOGIES\calendation\auth-api

# Run the new modular seeder
npx tsx prisma/seed.new.ts
```

### 2. Expected Output
```
╔══════════════════════════════════════════╗
║   Database Seeding - Modular System     ║
╚══════════════════════════════════════════╝

🌱 Starting database seeding...

🤖 Seeding AI Platforms...
✓ AI Platforms seeded

🧠 Seeding AI Models...
✓ AI Models seeded

🔧 Seeding Tools...
✓ Tools seeded

... (more seeding operations)

🗨️  Seeding conversations...
  ✓ Created 3 conversations
  ✓ Created 9 messages across 3 conversations

📜 Seeding history...
  ✓ Created 12 login history entries
  ✓ Created 12 logic history entries

❓ Seeding FAQs...
  ✓ Upserted 6 FAQs
  ℹ️  Categories: Account, Agents, AI Models, Billing, Data, API

📝 Seeding prompts...
  ✓ Created 6 prompts
  ℹ️  Categories: Development, Database, Communication, Productivity
  ℹ️  Public: 5, Private: 1

✅ Database seeding completed successfully!

⏱️  Total seeding time: 3.45s

👋 Seeder process completed
```

## Testing Individual Seeders

### Test Conversations Seeder
```typescript
import { PrismaClient } from '@prisma/client';
import { ConversationsSeeder } from './prisma/seeders/conversations.seeder';

const prisma = new PrismaClient();

// Mock user and agent data
const userMapping = {
  'test@example.com': { id: 'user-123', email: 'test@example.com' }
};

const agentMapping = {
  'user-123': [
    { id: 'agent-1', name: 'Test Agent', userId: 'user-123' }
  ]
};

const seeder = new ConversationsSeeder(prisma, userMapping, agentMapping);
await seeder.seed();
```

### Test History Seeder
```typescript
import { HistorySeeder } from './prisma/seeders/history.seeder';

const seeder = new HistorySeeder(prisma, userMapping, agentMapping);
await seeder.seed();
```

### Test FAQs Seeder
```typescript
import { FaqsSeeder } from './prisma/seeders/faqs.seeder';

const seeder = new FaqsSeeder(prisma);
await seeder.seed();

// Test category filtering
const accountFAQs = await seeder.getFAQsByCategory('Account');
console.log('Account FAQs:', accountFAQs.length);

// Test published filtering
const published = await seeder.getPublishedFAQs();
console.log('Published FAQs:', published.length);
```

### Test Prompts Seeder
```typescript
import { PromptsSeeder } from './prisma/seeders/prompts.seeder';

const seeder = new PromptsSeeder(prisma, userMapping);
await seeder.seed();

// Test category filtering
const devPrompts = await seeder.getPromptsByCategory('Development');
console.log('Development Prompts:', devPrompts.length);

// Test public filtering
const publicPrompts = await seeder.getPublicPrompts();
console.log('Public Prompts:', publicPrompts.length);
```

## Validation Queries

### Check Created Data
```sql
-- Check conversations
SELECT COUNT(*) as total_conversations FROM Conversation;
SELECT COUNT(*) as total_messages FROM Message;

-- Check history
SELECT COUNT(*) as total_login_history FROM LoginHistory;
SELECT COUNT(*) as total_logic_history FROM LogicHistory;

-- Check FAQs
SELECT COUNT(*) as total_faqs FROM FAQ;
SELECT category, COUNT(*) as count FROM FAQ GROUP BY category;

-- Check prompts
SELECT COUNT(*) as total_prompts FROM Prompt;
SELECT category, COUNT(*) as count FROM Prompt GROUP BY category;
SELECT isPublic, COUNT(*) as count FROM Prompt GROUP BY isPublic;
```

### Check Relationships
```sql
-- Conversations with users and agents
SELECT 
  c.id, 
  c.title, 
  u.email as user_email, 
  a.name as agent_name
FROM Conversation c
JOIN User u ON c.userId = u.id
JOIN Agent a ON c.agentId = a.id;

-- Messages in conversations
SELECT 
  c.title as conversation,
  COUNT(m.id) as message_count
FROM Conversation c
LEFT JOIN Message m ON c.id = m.conversationId
GROUP BY c.id, c.title;

-- Login history by user
SELECT 
  u.email,
  COUNT(lh.id) as login_count
FROM User u
LEFT JOIN LoginHistory lh ON u.id = lh.userId
GROUP BY u.id, u.email;
```

## Performance Testing

### Measure Seeding Time
```typescript
const startTime = Date.now();

const seeder = new DatabaseSeeder(prisma);
await seeder.seed();

const duration = (Date.now() - startTime) / 1000;
console.log(`Total time: ${duration}s`);
```

### Compare with Old Seeder
```powershell
# Old seeder
Measure-Command { npx tsx prisma/seed.ts }

# New seeder
Measure-Command { npx tsx prisma/seed.new.ts }
```

## Troubleshooting

### Issue: "Repository not found"
**Solution:** Check that all repositories are exported from `src/repositories/index.ts`

### Issue: "Mock file not found"
**Solution:** Verify mock files exist in `prisma/mock/` directory

### Issue: "User mapping is empty"
**Solution:** Ensure `seedUsers()` runs before seeders that depend on users

### Issue: "Duplicate key error"
**Solution:** The seeder includes duplicate checking. If this occurs:
1. Check database for existing data
2. Clear data with `npx prisma migrate reset`
3. Run seeder again

### Issue: "Foreign key constraint failed"
**Solution:** Ensure seeding order is correct:
1. AI Platforms → AI Models → AI Keys
2. Labels
3. Roles → Users
4. Agents (depends on Users)
5. Conversations (depends on Users & Agents)
6. Messages (depends on Conversations)

## Clean Database Before Testing

```powershell
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset --force

# Run new seeder
npx tsx prisma/seed.new.ts
```

## Verify Seeder Idempotency

The seeders should be idempotent (safe to run multiple times):

```powershell
# Run seeder twice
npx tsx prisma/seed.new.ts
npx tsx prisma/seed.new.ts

# Check for duplicates
npx prisma studio
# Manually verify no duplicate records exist
```

## Success Criteria

✅ **All seeders complete without errors**  
✅ **Data is created in correct order**  
✅ **No duplicate records**  
✅ **All relationships are valid**  
✅ **Performance is acceptable (<10s for full seed)**  
✅ **Idempotent (can run multiple times)**  

## Next Steps After Testing

1. ✅ Verify all data is created correctly
2. ✅ Check performance metrics
3. ⏳ Create remaining mock files
4. ⏳ Create remaining seeders
5. ⏳ Write unit tests
6. ⏳ Update package.json to use new seeder
7. ⏳ Archive old seed.ts

---

**Note:** Some seeders may show warnings like "No users found" if dependencies haven't been seeded yet. This is expected and the seeder will skip those operations gracefully.
