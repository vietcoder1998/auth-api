# Seeder Migration Script

## Overview
This script helps migrate from the old monolithic seed.ts to the new modular structure.

## Migration Steps

### Step 1: Backup Current Seed File
```powershell
Copy-Item prisma\seed.ts prisma\seed.old.ts
```

### Step 2: Create Mock Files

Run this script to extract mock data from `src/mock/` to `prisma/mock/`:

```powershell
# Create mock directory if it doesn't exist
New-Item -ItemType Directory -Force -Path prisma\mock

# Copy and convert mock files
$mockFiles = @(
    "aiKey",
    "aiPlatform", 
    "billing",
    "blog",
    "configs",
    "conversations",
    "faq",
    "jobs",
    "labels",
    "logic-history",
    "login-history",
    "mail-templates",
    "notification-templates",
    "permissions",
    "prompts",
    "sso",
    "users",
    "agents"
)

foreach ($file in $mockFiles) {
    Write-Host "Processing $file..."
    
    # Check if file exists in src/mock
    $srcFile = "src\mock\$file.ts"
    if (Test-Path $srcFile) {
        # Copy to prisma/mock with .mock.ts extension
        $destFile = "prisma\mock\$file.mock.ts"
        Copy-Item $srcFile $destFile
        Write-Host "✓ Copied $file to prisma\mock\" -ForegroundColor Green
    } else {
        Write-Host "⚠ File not found: $srcFile" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Mock files migration complete!" -ForegroundColor Green
```

### Step 3: Update Imports

Update import paths in the new mock files:

```powershell
# This will update all import paths in mock files
Get-ChildItem prisma\mock\*.mock.ts | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "\.\.\/", "../../src/"
    Set-Content $_.FullName $content
    Write-Host "✓ Updated imports in $($_.Name)" -ForegroundColor Green
}
```

### Step 4: Test New Seeder

```powershell
# Test with the new seed file
npx tsx prisma/seed.new.ts
```

### Step 5: Switch to New Seeder (if test passes)

```powershell
# Backup old seed
Move-Item prisma\seed.ts prisma\seed.old.backup.ts -Force

# Use new seed
Move-Item prisma\seed.new.ts prisma\seed.ts -Force

Write-Host "✅ Migration complete! Old seed backed up as seed.old.backup.ts" -ForegroundColor Green
```

### Step 6: Update package.json

Ensure your `package.json` has the correct seed script:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

## Rollback (if needed)

```powershell
# Restore old seed file
Copy-Item prisma\seed.old.backup.ts prisma\seed.ts -Force
Write-Host "✅ Rolled back to old seed file" -ForegroundColor Yellow
```

## Verification

Run these commands to verify the migration:

```powershell
# 1. Check file structure
Get-ChildItem prisma -Recurse | Select-Object FullName

# 2. Run seed
npm run seed

# 3. Check database
npx prisma studio
```

## Troubleshooting

### Issue: Import errors in mock files

**Solution:**
```typescript
// Old import
import { something } from '../utils';

// New import
import { something } from '../../src/utils';
```

### Issue: Mock data not found

**Solution:**
Check that all mock files are in `prisma/mock/` with `.mock.ts` extension:
```powershell
Get-ChildItem prisma\mock\*.mock.ts
```

### Issue: Repository not found

**Solution:**
Ensure all repositories are exported from `src/repositories/index.ts`:
```typescript
export * from './aiPlatform.repository';
export * from './aiModel.repository';
// ... etc
```

## Post-Migration Tasks

1. **Delete old mock files** (optional)
   ```powershell
   # After verifying new seeder works
   Remove-Item src\mock\* -Confirm
   ```

2. **Update documentation**
   - Update README with new seeding instructions
   - Document new mock file structure

3. **Create additional seeders**
   - Implement specialized seeders for complex entities
   - See `docs/SEEDER_REFACTORING_GUIDE.md`

## Benefits of New Structure

✅ **Modular**: Each entity in its own file  
✅ **Testable**: Can test individual seeders  
✅ **Maintainable**: Easy to find and update  
✅ **Scalable**: Easy to add new entities  
✅ **Type-safe**: Full TypeScript support  

## Next Steps

1. Create remaining specialized seeders:
   - `agents.seeder.ts`
   - `history.seeder.ts`
   - `conversations.seeder.ts`
   - `faqs.seeder.ts`

2. Implement selective seeding:
   ```typescript
   await seeder.seedOnly(['users', 'agents']);
   ```

3. Add seeding profiles:
   ```typescript
   await seeder.seed({ profile: 'minimal' });
   ```

---

**Need Help?**
- See: `docs/SEEDER_REFACTORING_GUIDE.md`
- Contact: Development Team
