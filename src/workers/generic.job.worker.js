import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Get job data from environment variables if available
const jobId = process.env.JOB_ID;
const jobType = process.env.JOB_TYPE;
const jobPayload = process.env.JOB_PAYLOAD ? JSON.parse(process.env.JOB_PAYLOAD) : {};
const workerId = process.env.WORKER_ID;

// If job data is in environment variables, process immediately
if (jobId && jobType) {
  processJob({ jobId, type: jobType, payload: jobPayload, workerId });
}

// Handle messages from parent process
process.on('message', async (jobData) => {
  await processJob(jobData);
});

async function processJob(jobData) {
  try {
    switch (jobData.type) {
      case 'extract': {
        // Example: backup all tables to a JSON file
        const tables = await prisma.$queryRawUnsafe("SHOW TABLES");
        const dbBackup = {};
        for (const tableObj of tables) {
          const tableName = String(Object.values(tableObj)[0]);
          const rows = await prisma.$queryRawUnsafe(`SELECT * FROM \`${tableName}\``);
          dbBackup[tableName] = rows;
        }
        const fs = require('fs');
        const path = require('path');
        const backupDir = path.resolve(__dirname, '../../backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
        const backupFile = path.join(backupDir, `db-backup-${jobData.jobId}.json`);
        
        // Handle BigInt serialization
        const safeStringify = (obj) => {
          return JSON.stringify(obj, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
          );
        };
        
        fs.writeFileSync(backupFile, safeStringify(dbBackup, null, 2), 'utf8');
        process.send({ status: 'success', data: { backupFile } });
        break;
      }
      default:
        process.send({ status: 'no-op', data: { type: jobData.type } });
    }
  } catch (err) {
    process.send({ status: 'error', error: err.message });
  }
}
