import { exec } from 'child_process';
import { logInfo, logError } from '../middlewares/logger.middle';

// Disk info utility (async, only for Linux/Unix)
export function getDisk(cb: (disk: string | null) => void): void {
  exec('df -h --output=used,size,pcent / | tail -1', (err: Error | null, stdout: string) => {
    if (err) return cb(null);
    const parts: string[] = stdout.trim().split(/\s+/);
    let used = parts[0] || '';
    let size = parts[1] || '';
    let percent = parts[2] || '';
    // If percent missing, try to extract from rest of line
    if (!percent && stdout) {
      const match = stdout.match(/(\d+)%/);
      percent = match ? match[0] : '';
    }
    // If all missing, return null
    if (!used && !size && !percent) return cb(null);
    cb(`${used} / ${size} (${percent})`);
  });
}

// Redis connection check utility
export async function checkRedisConnection(client: any): Promise<boolean> {
  try {
    await client.ping();
    logInfo('✅ Redis connection successful', { file: 'validationUtils.ts', line: '24' });
    return true;
  } catch (error) {
    logError('❌ Redis connection failed:', { file: 'validationUtils.ts', line: '27', error });
    return false;
  }
}
