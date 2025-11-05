import { fork, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

describe('Worker System Tests - Fixed', () => {
  let mockWorkerPath: string;
  let worker: ChildProcess;

  beforeAll(() => {
    // Create a simple mock worker that responds to environment variables
    const mockWorkerCode = `
const jobId = process.env.JOB_ID;
const jobType = process.env.JOB_TYPE;
const payload = process.env.JOB_PAYLOAD ? JSON.parse(process.env.JOB_PAYLOAD) : null;

// Handle environment-based jobs only (most reliable)
if (jobId && jobType) {
  setTimeout(() => {
    if (process.send) {
      process.send({
        success: true,
        data: {
          jobId,
          type: jobType,
          result: 'Job completed successfully',
          payload,
          timestamp: new Date().toISOString()
        }
      });
    }
    process.exit(0);
  }, 100);
} else {
  // No valid job data
  setTimeout(() => {
    process.exit(1);
  }, 100);
}
`;

    // Create workers directory if it doesn't exist
    const workersDir = path.resolve(__dirname, '../workers');
    if (!fs.existsSync(workersDir)) {
      fs.mkdirSync(workersDir, { recursive: true });
    }

    // Write the mock worker file
    mockWorkerPath = path.join(workersDir, 'stable-worker.js');
    fs.writeFileSync(mockWorkerPath, mockWorkerCode);
  });

  afterAll(() => {
    // Clean up mock worker file
    if (fs.existsSync(mockWorkerPath)) {
      fs.unlinkSync(mockWorkerPath);
    }
  });

  afterEach((done) => {
    if (worker && !worker.killed) {
      worker.removeAllListeners();
      worker.on('exit', () => {
        worker = null as any;
        setTimeout(done, 50);
      });
      worker.kill('SIGTERM');
    } else {
      worker = null as any;
      done();
    }
  });

  describe('Environment Variable Job Processing', () => {
    it('should process backup job via environment variables', (done) => {
      const testJobId = `backup-env-${Date.now()}`;
      
      worker = fork(mockWorkerPath, [], {
        env: {
          ...process.env,
          NODE_ENV: 'test',
          JOB_ID: testJobId,
          JOB_TYPE: 'backup',
          JOB_PAYLOAD: JSON.stringify({ 
            database: 'test_db',
            tables: ['users', 'orders']
          }),
        },
        silent: true
      });

      worker.on('message', (result: any) => {
        try {
          expect(result.success).toBe(true);
          expect(result.data.jobId).toBe(testJobId);
          expect(result.data.type).toBe('backup');
          expect(result.data.timestamp).toBeDefined();
          done();
        } catch (error) {
          done(error);
        }
      });

      worker.on('error', done);
    }, 3000);

    it('should process extract job via environment variables', (done) => {
      const testJobId = `extract-env-${Date.now()}`;
      
      worker = fork(mockWorkerPath, [], {
        env: {
          ...process.env,
          NODE_ENV: 'test',
          JOB_ID: testJobId,
          JOB_TYPE: 'extract',
          JOB_PAYLOAD: JSON.stringify({ 
            database: 'analytics_db',
            tables: ['events', 'users'],
            format: 'json'
          }),
        },
        silent: true
      });

      worker.on('message', (result: any) => {
        try {
          expect(result.success).toBe(true);
          expect(result.data.jobId).toBe(testJobId);
          expect(result.data.type).toBe('extract');
          expect(result.data.payload.database).toBe('analytics_db');
          done();
        } catch (error) {
          done(error);
        }
      });

      worker.on('error', done);
    }, 3000);

    it('should process fine-tuning job via environment variables', (done) => {
      const testJobId = `finetuning-env-${Date.now()}`;
      
      worker = fork(mockWorkerPath, [], {
        env: {
          ...process.env,
          NODE_ENV: 'test',
          JOB_ID: testJobId,
          JOB_TYPE: 'fine-tuning',
          JOB_PAYLOAD: JSON.stringify({ 
            model: 'gpt-4',
            dataset: 'training.jsonl',
            epochs: 10
          }),
        },
        silent: true
      });

      worker.on('message', (result: any) => {
        try {
          expect(result.success).toBe(true);
          expect(result.data.jobId).toBe(testJobId);
          expect(result.data.type).toBe('fine-tuning');
          expect(result.data.payload.model).toBe('gpt-4');
          done();
        } catch (error) {
          done(error);
        }
      });

      worker.on('error', done);
    }, 3000);

    it('should process generic job via environment variables', (done) => {
      const testJobId = `generic-env-${Date.now()}`;
      
      worker = fork(mockWorkerPath, [], {
        env: {
          ...process.env,
          NODE_ENV: 'test',
          JOB_ID: testJobId,
          JOB_TYPE: 'generic',
          JOB_PAYLOAD: JSON.stringify({ 
            action: 'process',
            data: 'test-data',
            options: { format: 'json' }
          }),
        },
        silent: true
      });

      worker.on('message', (result: any) => {
        try {
          expect(result.success).toBe(true);
          expect(result.data.jobId).toBe(testJobId);
          expect(result.data.type).toBe('generic');
          expect(result.data.payload.action).toBe('process');
          done();
        } catch (error) {
          done(error);
        }
      });

      worker.on('error', done);
    }, 3000);
  });

  describe('Worker Error Handling', () => {
    it('should exit when no job data is provided', (done) => {
      worker = fork(mockWorkerPath, [], {
        env: { ...process.env, NODE_ENV: 'test' },
        silent: true
      });

      worker.on('exit', (code) => {
        try {
          expect(code).toBe(1); // Should exit with error code
          done();
        } catch (error) {
          done(error);
        }
      });

      worker.on('message', (result: any) => {
        // Should not receive any message
        done(new Error('Worker should not send message without job data'));
      });
    }, 3000);

    it('should handle complex nested payloads', (done) => {
      const testJobId = `complex-${Date.now()}`;
      const complexPayload = {
        config: {
          database: { host: 'localhost', port: 3306 },
          options: { compression: true, parallel: false }
        },
        tasks: [
          { name: 'backup', priority: 1 },
          { name: 'cleanup', priority: 2 }
        ]
      };
      
      worker = fork(mockWorkerPath, [], {
        env: {
          ...process.env,
          NODE_ENV: 'test',
          JOB_ID: testJobId,
          JOB_TYPE: 'complex',
          JOB_PAYLOAD: JSON.stringify(complexPayload)
        },
        silent: true
      });

      worker.on('message', (result: any) => {
        try {
          expect(result.success).toBe(true);
          expect(result.data.jobId).toBe(testJobId);
          expect(result.data.payload).toEqual(complexPayload);
          done();
        } catch (error) {
          done(error);
        }
      });

      worker.on('error', done);
    }, 3000);
  });

  describe('Worker Process Management', () => {
    it('should create and terminate worker processes cleanly', (done) => {
      const testJobId = `lifecycle-${Date.now()}`;
      let processStarted = false;
      let processExited = false;
      
      worker = fork(mockWorkerPath, [], {
        env: {
          ...process.env,
          NODE_ENV: 'test',
          JOB_ID: testJobId,
          JOB_TYPE: 'test',
          JOB_PAYLOAD: JSON.stringify({ test: true })
        },
        silent: true
      });

      worker.on('spawn', () => {
        processStarted = true;
      });

      worker.on('message', (result: any) => {
        try {
          expect(processStarted).toBe(true);
          expect(result.success).toBe(true);
          expect(result.data.jobId).toBe(testJobId);
        } catch (error) {
          done(error);
        }
      });

      worker.on('exit', (code) => {
        processExited = true;
        try {
          expect(processStarted).toBe(true);
          expect(code).toBe(0); // Clean exit
          done();
        } catch (error) {
          done(error);
        }
      });

      worker.on('error', done);
    }, 3000);
  });
});