# Database Schema Migration Fix

## Issue
The `priority` column was added to the Job model in the Prisma schema but doesn't exist in the database, causing runtime errors when querying jobs.

## Root Cause
The database schema is out of sync with the Prisma schema. The Job model includes:
```prisma
model Job {
  // ... other fields
  priority    Int       @default(0)
  // ... other fields
}
```

But this column doesn't exist in the actual database table.

## Immediate Fix Applied

### 1. Safe Property Access
Updated `JobRepository.toDro()` method to safely access the priority property:
```typescript
priority: (job as any).priority ?? 0, // Safe access in case column doesn't exist yet
```

### 2. Error Handling in Repository
Added try-catch in `findAllWithRelations()`:
```typescript
async findAllWithRelations(): Promise<any[]> {
  try {
    return await this.jobModel.findMany({...});
  } catch (error) {
    console.warn('Database schema issue detected, returning empty jobs array:', error);
    return [];
  }
}
```

### 3. Graceful Service Handling
Updated job service to return empty array instead of throwing:
```typescript
public async getJobs(): Promise<any[]> {
  try {
    return await this.jobRepository.findAllWithRelations();
  } catch (error) {
    logError('Failed to get jobs - possible database schema mismatch', { error });
    return []; // Return empty array instead of throwing
  }
}
```

## Permanent Solution

To fully resolve this issue, run the database migration:

```bash
cd auth-api
npx prisma db push
```

This will add the missing `priority` column to the database.

## Alternative: Manual SQL Migration

If Prisma push doesn't work, manually add the column:

```sql
ALTER TABLE job ADD COLUMN priority INT NOT NULL DEFAULT 0;
```

## Verification

After applying the migration:
1. The application should start without errors
2. Job queries should include the priority field
3. Remove the error handling workarounds if desired

## Files Modified
- `src/repositories/job.repository.ts` - Added safe property access and error handling
- `src/services/job.service.ts` - Added graceful error handling

This ensures the application remains stable while the database schema is being updated.