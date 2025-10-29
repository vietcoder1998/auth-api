import os from 'os';
import fs from 'fs';
import { logError } from '../middlewares/logger.middle';
import { PrismaClient } from '@prisma/client';

export async function getDatabaseStatus(prisma: PrismaClient): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (dbError) {
    logError('Database health check failed:', { error: dbError });
    return false;
  }
}

export async function getRedisStatus(client: any): Promise<boolean> {
  try {
    await client.ping();
    return true;
  } catch (redisError) {
    logError('Redis health check failed:', { error: redisError });
    return false;
  }
}

export function getMemoryStatus() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = ((usedMem / totalMem) * 100).toFixed(1);
  return `${(usedMem / 1024 / 1024).toFixed(0)}MB / ${(totalMem / 1024 / 1024).toFixed(0)}MB (${memPercent}%)`;
}

export function getCpuStatus() {
  const cpus = os.cpus();
  const cpuLoad =
    cpus && cpus.length > 0
      ? cpus.reduce(
          (acc, cpu) => acc + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq,
          0,
        ) /
        (cpus.length * cpus[0].times.idle + 1)
      : 0;
  return {
    cpu: `${cpus.length} cores`,
    cpuLoad,
  };
}

export function getOsStatus() {
  let osStatus = {
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    hostname: os.hostname(),
    isDocker: false,
  };
  try {
    osStatus.isDocker =
      fs.existsSync('/.dockerenv') ||
      (fs.existsSync('/proc/self/cgroup') &&
        fs.readFileSync('/proc/self/cgroup', 'utf8').includes('docker'));
  } catch {}
  return osStatus;
}

export function getChildProcessInfo() {
  try {
    return {
      pid: process.pid,
      ppid: process.ppid,
      execPath: process.execPath,
      argv: process.argv,
      cwd: process.cwd(),
      title: process.title,
      platform: process.platform,
      version: process.version,
      versions: process.versions,
      env: process.env,
    };
  } catch {
    return {};
  }
}
