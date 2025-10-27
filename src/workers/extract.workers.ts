import { parentPort } from 'worker_threads';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

parentPort?.on('message', async (job: { jobId: string; type: string; payload: any }) => {
  try {
    // Backup all tables to a JSON file
    const tables = await prisma.$queryRawUnsafe<any[]>("SHOW TABLES");
    const dbBackup: Record<string, any[]> = {};
    for (const tableObj of tables) {
      const tableName = String(Object.values(tableObj)[0]);
      const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM \`${tableName}\``);
      dbBackup[tableName] = rows;
    }
    const backupDir = path.resolve(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
    const backupFile = path.join(backupDir, `db-backup-${job.jobId}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(dbBackup, null, 2), 'utf8');
    await prisma.job.update({
      where: { id: job.jobId },
      data: {
        status: 'completed',
        result: JSON.stringify({ message: 'DB backup completed', backupFile }),
        finishedAt: new Date(),
      },
    });
    parentPort?.postMessage({ success: true, jobId: job.jobId, backupFile });
  } catch (error: any) {
    await prisma.job.update({
      where: { id: job.jobId },
      data: {
        status: 'failed',
        error: String(error?.message || error),
        finishedAt: new Date(),
      },
    });
    parentPort?.postMessage({ success: false, jobId: job.jobId, error });
  } finally {
    await prisma.$disconnect();
  }
});
