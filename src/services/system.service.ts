import { exec } from 'child_process';

/**
 * Force restart the Node.js process (useful for self-healing or admin-triggered restarts).
 * This will exit the process with code 1, which should trigger a restart if managed by PM2, Docker, or similar.
 */
export function forceRestartNode(): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    try {
      const path = require('path');
      const cwd = process.cwd();
      const env = process.env.NODE_ENV || 'development';
      let command = '';
      if (env === 'development') {
        command = `cd ${cwd} && npm run dev`;
      } else {
        command = `cd ${cwd} && npm start`;
      }
      console.log(`[Restart] NODE_ENV: ${env}, running: ${command}`);
      // Kill current process and start new one
      const { exec } = require('child_process');
      exec(command, (err: any, stdout: string, stderr: string) => {
        if (err) {
          console.error('Restart error:', err);
          resolve({ success: false, message: 'Failed to restart Node.js process.' });
        } else {
          console.log('Restart stdout:', stdout);
          console.log('Restart stderr:', stderr);
          resolve({ success: true, message: `Node.js process restarted with: ${command}` });
        }
        // Exit current process after starting new one
        setTimeout(() => {
          process.exit(0);
        }, 100);
      });
    } catch (err) {
      resolve({ success: false, message: 'Failed to restart Node.js process.' });
    }
  });
}
