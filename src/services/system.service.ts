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
        command = `npm run dev`;
      } else {
        command = `npm start`;
      }
      console.log(`[Restart] NODE_ENV: ${env}, will run: ${command} in ${cwd}`);
      const { spawn } = require('child_process');
      // Spawn new process detached from parent
      const child = spawn(command, {
        cwd,
        shell: true,
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      // Exit current process
      setTimeout(() => {
        process.exit(0);
      }, 100);
      resolve({ success: true, message: `Node.js process killed and restarted with: ${command}` });
    } catch (err) {
      resolve({ success: false, message: 'Failed to restart Node.js process.' });
    }
  });
}
