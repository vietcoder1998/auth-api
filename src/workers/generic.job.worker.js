const { parentPort } = require('worker_threads');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

parentPort.on('message', async (jobData) => {
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
        fs.writeFileSync(backupFile, JSON.stringify(dbBackup, null, 2), 'utf8');
        parentPort.postMessage({ status: 'success', backupFile });
        break;
      }
      default:
        parentPort.postMessage({ status: 'no-op', type: jobData.type });
    }
  } catch (err) {
    parentPort.postMessage({ status: 'error', error: err.message });
  }
});
