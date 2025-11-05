import { ChildProcess, fork } from 'child_process';
import path from 'path';
import { BackupJobPayload, WorkerJobData, WorkerResponse } from '../interfaces/worker.interface';

// Mock UUID to prevent random test failures
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-job-id-123'),
}));

describe('Backup Worker Tests', () => {
  let worker: ChildProcess;
  const workerPath = path.resolve(__dirname, '../workers/backup.worker.ts');

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach((done) => {
    if (worker && !worker.killed) {
      worker.removeAllListeners();
      worker.on('exit', () => {
        done();
      });
      worker.kill('SIGTERM');
    } else {
      done();
    }
  });

  describe('Environment Variable Backup Jobs', () => {
    it('should process backup job via environment variables with default options', (done) => {
      const jobId = 'backup-env-job-1';
      const jobType = 'backup';
      const payload: BackupJobPayload = {
        jobId,
        type: jobType,
        workerId: 'worker-1',
        userId: 'user-123',
        database: 'test_db',
        tables: ['users', 'posts'],
        format: 'json',
        options: {
          compress: false,
          encryption: false,
          includeSchema: true,
          excludeData: false,
        },
      };

      worker = fork(workerPath, [], {
        env: {
          ...process.env,
          JOB_ID: jobId,
          JOB_TYPE: jobType,
          JOB_PAYLOAD: JSON.stringify(payload),
          WORKER_ID: 'worker-1',
          USER_ID: 'user-123',
        },
        silent: true,
      });

      worker.on('message', (result: WorkerResponse) => {
        try {
          expect(result).toBeDefined();
          expect(result.success).toBe(true);
          expect(result.data.jobId).toBe(jobId);
          expect(result.data.type).toBe(jobType);
          expect(result.data.result).toBe('Backup job completed');
          expect(result.data.payload).toEqual(payload);
          done();
        } catch (error) {
          done(error);
        }
      });

      worker.on('error', done);

      setTimeout(() => {
        done(new Error('Test timeout: Worker did not respond within 5 seconds'));
      }, 5000);
    }, 10000);

    it('should process backup job via environment variables with compression enabled', (done) => {
      const jobId = 'backup-env-job-2';
      const jobType = 'backup';
      const payload: BackupJobPayload = {
        jobId,
        type: jobType,
        workerId: 'worker-2',
        userId: 'user-456',
        database: 'production_db',
        format: 'sql',
        options: {
          compress: true,
          encryption: true,
          includeSchema: true,
          excludeData: false,
        },
      };

      worker = fork(workerPath, [], {
        env: {
          ...process.env,
          JOB_ID: jobId,
          JOB_TYPE: jobType,
          JOB_PAYLOAD: JSON.stringify(payload),
          WORKER_ID: 'worker-2',
          USER_ID: 'user-456',
        },
        silent: true,
      });

      worker.on('message', (result: WorkerResponse) => {
        try {
          expect(result).toBeDefined();
          expect(result.success).toBe(true);
          expect(result.data.jobId).toBe(jobId);
          expect(result.data.type).toBe(jobType);
          expect(result.data.payload.options?.compress).toBe(true);
          expect(result.data.payload.options?.encryption).toBe(true);
          done();
        } catch (error) {
          done(error);
        }
      });

      worker.on('error', done);

      setTimeout(() => {
        done(new Error('Test timeout: Worker did not respond within 5 seconds'));
      }, 5000);
    }, 10000);

    it('should handle minimal payload in environment variables', (done) => {
      const jobId = 'backup-env-job-3';
      const jobType = 'backup';

      worker = fork(workerPath, [], {
        env: {
          ...process.env,
          JOB_ID: jobId,
          JOB_TYPE: jobType,
          WORKER_ID: 'worker-3',
          USER_ID: 'user-789',
          // No JOB_PAYLOAD - should use defaults
        },
        silent: true,
      });

      worker.on('message', (result: WorkerResponse) => {
        try {
          expect(result).toBeDefined();
          expect(result.success).toBe(true);
          expect(result.data.jobId).toBe(jobId);
          expect(result.data.type).toBe(jobType);
          expect(result.data.payload.jobId).toBe(jobId);
          expect(result.data.payload.type).toBe(jobType);
          expect(result.data.payload.workerId).toBe('worker-3');
          expect(result.data.payload.userId).toBe('user-789');
          done();
        } catch (error) {
          done(error);
        }
      });

      worker.on('error', done);

      setTimeout(() => {
        done(new Error('Test timeout: Worker did not respond within 5 seconds'));
      }, 5000);
    }, 10000);
  });

  describe('Message-Based Backup Jobs', () => {
    it('should process backup job via message with full configuration', (done) => {
      const jobId = 'backup-msg-job-1';
      const jobType = 'backup';
      const payload: BackupJobPayload = {
        jobId,
        type: jobType,
        workerId: 'msg-worker-1',
        userId: 'msg-user-123',
        database: 'analytics_db',
        tables: ['events', 'users', 'sessions'],
        format: 'json',
        options: {
          compress: true,
          encryption: true,
          includeSchema: false,
          excludeData: true,
        },
        metadata: {
          source: 'api_request',
          priority: 'high',
          retention: '30d',
        },
      };

      const jobData: WorkerJobData<BackupJobPayload> = {
        jobId,
        type: jobType,
        payload,
      };

      worker = fork(workerPath, [], { silent: true });

      worker.on('message', (result: WorkerResponse) => {
        try {
          expect(result).toBeDefined();
          expect(result.success).toBe(true);
          expect(result.data.jobId).toBe(jobId);
          expect(result.data.type).toBe(jobType);
          expect(result.data.result).toBe('Backup job completed');
          expect(result.data.payload).toEqual(payload);
          expect(result.data.payload.metadata).toEqual({
            source: 'api_request',
            priority: 'high',
            retention: '30d',
          });
          done();
        } catch (error) {
          done(error);
        }
      });

      worker.on('error', done);

      // Send job data via message
      setTimeout(() => {
        worker.send(jobData);
      }, 100);

      setTimeout(() => {
        done(new Error('Test timeout: Worker did not respond within 5 seconds'));
      }, 5000);
    }, 10000);

    it('should handle backup job with schema-only option', (done) => {
      const jobId = 'backup-msg-job-2';
      const jobType = 'backup';
      const payload: BackupJobPayload = {
        jobId,
        type: jobType,
        workerId: 'msg-worker-2',
        userId: 'msg-user-456',
        database: 'schema_db',
        format: 'sql',
        options: {
          compress: false,
          encryption: false,
          includeSchema: true,
          excludeData: true, // Schema only backup
        },
      };

      const jobData: WorkerJobData<BackupJobPayload> = {
        jobId,
        type: jobType,
        payload,
      };

      worker = fork(workerPath, [], { silent: true });

      worker.on('message', (result: WorkerResponse) => {
        try {
          expect(result).toBeDefined();
          expect(result.success).toBe(true);
          expect(result.data.payload.options?.includeSchema).toBe(true);
          expect(result.data.payload.options?.excludeData).toBe(true);
          done();
        } catch (error) {
          done(error);
        }
      });

      worker.on('error', done);

      setTimeout(() => {
        worker.send(jobData);
      }, 100);

      setTimeout(() => {
        done(new Error('Test timeout: Worker did not respond within 5 seconds'));
      }, 5000);
    }, 10000);
  });

  describe('Backup Job Error Handling', () => {
    it('should handle backup errors gracefully via message', (done) => {
      const jobId = 'backup-error-job-1';
      const jobType = 'backup';
      const payload: BackupJobPayload = {
        jobId: '', // Invalid job ID to trigger error
        type: jobType,
        workerId: 'error-worker-1',
        userId: 'error-user-123',
      };

      const jobData: WorkerJobData<BackupJobPayload> = {
        jobId,
        type: jobType,
        payload,
      };

      worker = fork(workerPath, [], { silent: true });

      worker.on('message', (result: WorkerResponse) => {
        try {
          expect(result).toBeDefined();
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.data.jobId).toBe(''); // The invalid jobId from payload
          expect(result.data.type).toBe(jobType);
          done();
        } catch (error) {
          done(error);
        }
      });

      worker.on('error', done);

      setTimeout(() => {
        worker.send(jobData);
      }, 100);

      setTimeout(() => {
        done(new Error('Test timeout: Worker did not respond within 5 seconds'));
      }, 5000);
    }, 10000);
  });

  describe('Backup Job Validation', () => {
    it('should validate different backup formats and options', (done) => {
      const testCases = [
        {
          format: 'json' as const,
          options: { compress: true, encryption: false },
        },
        {
          format: 'sql' as const,
          options: { compress: false, encryption: true },
        },
      ];

      let completedTests = 0;
      const totalTests = testCases.length;

      testCases.forEach((testCase, index) => {
        const jobId = `backup-validation-job-${index + 1}`;
        const payload: BackupJobPayload = {
          jobId,
          type: 'backup',
          workerId: `validation-worker-${index + 1}`,
          userId: `validation-user-${index + 1}`,
          format: testCase.format,
          options: testCase.options,
        };

        const jobData: WorkerJobData<BackupJobPayload> = {
          jobId,
          type: 'backup',
          payload,
        };

        const testWorker = fork(workerPath, [], { silent: true });

        testWorker.on('message', (result: WorkerResponse) => {
          try {
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.data.payload.format).toBe(testCase.format);
            expect(result.data.payload.options).toMatchObject(testCase.options);

            completedTests++;
            testWorker.kill('SIGTERM');

            if (completedTests === totalTests) {
              done();
            }
          } catch (error) {
            testWorker.kill('SIGTERM');
            done(error);
          }
        });

        testWorker.on('error', (error) => {
          testWorker.kill('SIGTERM');
          done(error);
        });

        setTimeout(
          () => {
            testWorker.send(jobData);
          },
          100 * (index + 1),
        ); // Stagger the sends
      });

      setTimeout(() => {
        if (completedTests < totalTests) {
          done(new Error(`Test timeout: Only ${completedTests}/${totalTests} tests completed`));
        }
      }, 10000);
    }, 15000);
  });
});
