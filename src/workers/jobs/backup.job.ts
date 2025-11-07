import { prisma } from '@/src/setup';
import fs from 'fs';
import path from 'path';
import { parentPort, workerData } from 'worker_threads';

// Execute with worker_data
class BackupJob {
  private workerData: Record<string, any> = {};

  constructor(workerData: Record<string, any>) {
    this.workerData = workerData;
    this.process();
  }

  private async process() {
    // ✅ Lấy danh sách tất cả model trong Prisma
    const modelNames = Object.keys(prisma).filter((key) => {
      const v = (prisma as any)[key];
      return typeof v === 'object' && v !== null && typeof v.findMany === 'function';
    });

    parentPort?.postMessage({
      workerId: this.workerData.id,
      pid: process.pid,
      status: 'Đang backup...',
      models: modelNames,
    });

    const backupData: Record<string, any[]> = {};

    // ✅ Lặp qua từng model để lấy dữ liệu
    for (const modelName of modelNames) {
      const modelClient = (prisma as any)[modelName];
      try {
        const data = await modelClient.findMany();
        backupData[modelName] = data;
        parentPort?.postMessage({
          modelName,
          count: data.length,
        });
      } catch (err) {
        parentPort?.postMessage({
          modelName,
          error: (err as Error).message,
        });
      }
    }

    // ✅ Ghi ra file JSON (theo ngày giờ)
    const dir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(
      dir,
      `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
    );

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');

    parentPort?.postMessage({
      workerId: this.workerData.id,
      pid: process.pid,
      status: 'Hoàn tất backup toàn bộ database',
      filePath,
    });
  }
}

// process backup job on calling
new BackupJob(workerData);
