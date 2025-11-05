# Restore Worker Documentation

## Overview

The Restore Worker (`restore.worker.ts`) is designed to download backup files from URLs and restore them into the database. It supports various backup sources and provides comprehensive error handling and validation.

## Features

- **Multiple URL Protocols**: Supports HTTP, HTTPS, and FTP URLs
- **File Validation**: Validates backup file format and integrity
- **Batch Processing**: Configurable batch size for large restores
- **Error Handling**: Robust error handling with detailed logging
- **Temporary File Management**: Automatic cleanup of downloaded files
- **Database Integration**: Updates job status in the database
- **Progress Tracking**: Tracks records processed and tables restored

## Usage Examples

### 1. Basic HTTP Restore via Environment Variables

```bash
# Set environment variables
export JOB_ID="restore-001"
export JOB_TYPE="restore"
export JOB_PAYLOAD='{
  "backupUrl": "http://backup.server.com/database_backup.sql",
  "database": "production_db"
}'

# Run the worker
node src/workers/restore.worker.js
```

### 2. HTTPS Restore with Options via Message

```typescript
import { fork } from 'child_process';
import * as path from 'path';

const worker = fork(path.resolve(__dirname, 'workers/restore.worker.js'));

worker.send({
  jobId: 'restore-002',
  type: 'restore',
  payload: {
    backupUrl: 'https://s3.amazonaws.com/backups/full_backup_20231105.sql',
    database: 'analytics_db',
    tables: ['users', 'events', 'sessions'],
    options: {
      overwrite: true,
      validate: true,
      batchSize: 100,
      timeout: 600000
    }
  }
});

worker.on('message', (result) => {
  console.log('Restore result:', result);
});
```

### 3. Advanced Restore Configuration

```json
{
  "jobId": "restore-003",
  "type": "restore",
  "payload": {
    "backupUrl": "https://backup.company.com/encrypted_backup.sql.gz",
    "database": "enterprise_db",
    "tables": ["users", "orders", "products", "analytics", "audit_logs"],
    "options": {
      "overwrite": false,
      "validate": true,
      "batchSize": 200,
      "timeout": 1800000,
      "retryAttempts": 3,
      "skipErrors": false,
      "compression": "gzip",
      "encryption": {
        "enabled": true,
        "algorithm": "AES-256",
        "keyId": "backup-key-2023"
      }
    }
  }
}
```

## Payload Structure

### Required Fields

- `backupUrl` (string): URL to the backup file

### Optional Fields

- `database` (string): Target database name
- `tables` (string[]): Specific tables to restore
- `options` (object): Restore configuration options

### Options Object

- `overwrite` (boolean): Whether to overwrite existing data
- `validate` (boolean): Validate backup file before restoration
- `batchSize` (number): Number of SQL statements to process in each batch
- `timeout` (number): Download timeout in milliseconds
- `retryAttempts` (number): Number of retry attempts on failure
- `skipErrors` (boolean): Continue processing on non-critical errors
- `compression` (string): Compression format ('none', 'gzip', 'bzip2')
- `encryption` (object): Encryption configuration

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "jobId": "restore-001",
    "type": "restore",
    "result": "Restore completed successfully",
    "details": {
      "recordsProcessed": 1500,
      "tablesRestored": ["users", "orders", "products"],
      "duration": "45.2s"
    },
    "payload": { /* original payload */ }
  }
}
```

### Error Response

```json
{
  "success": false,
  "data": {
    "jobId": "restore-001",
    "type": "restore"
  },
  "error": "Download failed: Connection timeout"
}
```

## Integration with Job Service

### Creating a Restore Job

```typescript
import { JobService } from '../services/job.service';

const jobService = new JobService();

const restoreJob = await jobService.create({
  type: 'restore',
  payload: {
    backupUrl: 'https://backup.server.com/backup.sql',
    database: 'production_db',
    options: {
      validate: true,
      batchSize: 100
    }
  },
  priority: 1,
  maxRetries: 3,
  timeout: 600000,
  description: 'Restore production database from backup'
});

console.log('Restore job created:', restoreJob.id);
```

### Using Worker Service

```typescript
import { WorkerService } from '../services/worker.service';

const workerService = new WorkerService(
  rabbitMQRepository,
  jobRepository,
  jobResultRepository
);

// The worker service will automatically handle restore jobs
// when they are added to the job queue
await workerService.processJobs();
```

## Error Handling

The restore worker handles various error scenarios:

1. **Invalid URL**: Malformed or unreachable backup URLs
2. **Download Failures**: Network issues, timeouts, or HTTP errors
3. **File Validation**: Invalid backup file format or corrupted files
4. **Database Errors**: SQL syntax errors or constraint violations
5. **Disk Space**: Insufficient space for temporary files
6. **Permissions**: Database access or file system permission issues

## Security Considerations

1. **URL Validation**: Validate backup URLs to prevent SSRF attacks
2. **File Size Limits**: Implement file size limits to prevent DoS
3. **Temporary Files**: Secure temporary file handling and cleanup
4. **Database Permissions**: Use restricted database users for restoration
5. **Encryption**: Support for encrypted backup files
6. **Audit Logging**: Log all restore operations for security auditing

## Performance Optimization

1. **Batch Processing**: Use configurable batch sizes for large datasets
2. **Streaming Downloads**: Stream large backup files instead of loading into memory
3. **Parallel Processing**: Process multiple SQL statements in parallel where possible
4. **Connection Pooling**: Reuse database connections for better performance
5. **Progress Monitoring**: Provide real-time progress updates for long-running restores

## Monitoring and Logging

The worker provides comprehensive logging for:

- Download progress and completion
- File validation results
- Database restoration progress
- Error details and stack traces
- Performance metrics (duration, records processed)

## Testing

Run the restore worker tests:

```bash
npm test -- --testNamePattern="Restore Worker Tests"
```

The test suite covers:
- Environment variable job processing
- Message-based job processing
- Error handling scenarios
- Complex payload validation
- Different URL formats (HTTP, HTTPS, FTP)
- Configuration options testing