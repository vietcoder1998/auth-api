import { ChildProcess, fork } from 'child_process';
import path from 'path';
import { ExtractJobPayload, WorkerJobData, WorkerResponse } from '../interfaces/worker.interface';

// Mock UUID to prevent random test failures
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-job-id-123'),
}));

describe('Extract Worker Tests', () => {
  let worker: ChildProcess;
  const workerPath = path.resolve(__dirname, '../workers/extract.workers.ts');

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

  describe('Environment Variable Extract Jobs', () => {
    it('should process extract job via environment variables with JSON output', (done) => {
      const jobId = 'extract-env-job-1';
      const jobType = 'extract';
      const payload: ExtractJobPayload = {
        jobId,
        type: jobType,
        workerId: 'extract-worker-1',
        userId: 'user-123',
        database: 'test_db',
        tables: ['users', 'orders'],
        outputFormat: 'json',
        outputPath: '/tmp/extracts',
        options: {
          includeSchema: true,
          batchSize: 1000,
          compression: 'gzip',
        },
      };

      worker = fork(workerPath, [], {
        env: {
          ...process.env,
          JOB_ID: jobId,
          JOB_TYPE: jobType,
          JOB_PAYLOAD: JSON.stringify(payload),
          WORKER_ID: 'extract-worker-1',
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
          expect(result.data.result).toBe('DB backup completed');
          expect(result.data.details).toBeDefined();
          expect(result.data.details.backupFile).toContain(`db-backup-${jobId}.json`);
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

    it('should process extract job via environment variables with CSV output', (done) => {
      const jobId = 'extract-env-job-2';
      const jobType = 'extract';
      const payload: ExtractJobPayload = {
        jobId,
        type: jobType,
        workerId: 'extract-worker-2',
        userId: 'user-456',
        database: 'analytics_db',
        tables: ['events', 'sessions'],
        outputFormat: 'csv',
        outputPath: '/data/exports',
        options: {
          includeSchema: false,
          batchSize: 500,
          compression: 'zip',
        },
      };

      worker = fork(workerPath, [], {
        env: {
          ...process.env,
          JOB_ID: jobId,
          JOB_TYPE: jobType,
          JOB_PAYLOAD: JSON.stringify(payload),
          WORKER_ID: 'extract-worker-2',
          USER_ID: 'user-456',
        },
        silent: true,
      });

      worker.on('message', (result: WorkerResponse) => {
        try {
          expect(result).toBeDefined();
          expect(result.success).toBe(true);
          expect(result.data.jobId).toBe(jobId);
          expect(result.data.payload.outputFormat).toBe('csv');
          expect(result.data.payload.options?.compression).toBe('zip');
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
      const jobId = 'extract-env-job-3';
      const jobType = 'extract';

      worker = fork(workerPath, [], {
        env: {
          ...process.env,
          JOB_ID: jobId,
          JOB_TYPE: jobType,
          WORKER_ID: 'extract-worker-3',
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
          expect(result.data.payload.workerId).toBe('extract-worker-3');
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

  describe('Message-Based Extract Jobs', () => {
    it('should process extract job via message with SQL output', (done) => {
      const jobId = 'extract-msg-job-1';
      const jobType = 'extract';
      const payload: ExtractJobPayload = {
        jobId,
        type: jobType,
        workerId: 'msg-extract-worker-1',
        userId: 'msg-user-123',
        database: 'production_db',
        tables: ['products', 'categories', 'inventory'],
        outputFormat: 'sql',
        outputPath: '/backup/sql',
        options: {
          includeSchema: true,
          batchSize: 2000,
          compression: 'none',
        },
        metadata: {
          requestId: 'req-789',
          department: 'operations',
          scheduled: true,
        },
      };

      const jobData: WorkerJobData<ExtractJobPayload> = {
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
          expect(result.data.result).toBe('DB backup completed');
          expect(result.data.payload).toEqual(payload);
          expect(result.data.payload.metadata).toEqual({
            requestId: 'req-789',
            department: 'operations',
            scheduled: true,
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

    it('should handle extract job with specific table selection', (done) => {
      const jobId = 'extract-msg-job-2';
      const jobType = 'extract';
      const payload: ExtractJobPayload = {
        jobId,
        type: jobType,
        workerId: 'msg-extract-worker-2',
        userId: 'msg-user-456',
        database: 'reporting_db',
        tables: ['daily_stats', 'monthly_summary'], // Specific tables only
        outputFormat: 'json',
        options: {
          includeSchema: false,
          batchSize: 100,
          compression: 'gzip',
        },
      };

      const jobData: WorkerJobData<ExtractJobPayload> = {
        jobId,
        type: jobType,
        payload,
      };

      worker = fork(workerPath, [], { silent: true });

      worker.on('message', (result: WorkerResponse) => {
        try {
          expect(result).toBeDefined();
          expect(result.success).toBe(true);
          expect(result.data.payload.tables).toEqual(['daily_stats', 'monthly_summary']);
          expect(result.data.payload.options?.includeSchema).toBe(false);
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

  describe('Extract Job Error Handling', () => {
    it('should handle extract errors gracefully via message', (done) => {
      const jobId = 'extract-error-job-1';
      const jobType = 'extract';
      const payload: ExtractJobPayload = {
        jobId: '', // Invalid job ID to trigger error
        type: jobType,
        workerId: 'error-extract-worker-1',
        userId: 'error-user-123',
      };

      const jobData: WorkerJobData<ExtractJobPayload> = {
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

  describe('Extract Job Validation', () => {
    it('should validate different output formats and compression options', (done) => {
      const testCases = [
        {
          outputFormat: 'json' as const,
          compression: 'none' as const,
          batchSize: 500,
        },
        {
          outputFormat: 'csv' as const,
          compression: 'gzip' as const,
          batchSize: 1000,
        },
        {
          outputFormat: 'sql' as const,
          compression: 'zip' as const,
          batchSize: 2000,
        },
      ];

      let completedTests = 0;
      const totalTests = testCases.length;

      testCases.forEach((testCase, index) => {
        const jobId = `extract-validation-job-${index + 1}`;
        const payload: ExtractJobPayload = {
          jobId,
          type: 'extract',
          workerId: `validation-extract-worker-${index + 1}`,
          userId: `validation-user-${index + 1}`,
          outputFormat: testCase.outputFormat,
          options: {
            compression: testCase.compression,
            batchSize: testCase.batchSize,
            includeSchema: index % 2 === 0, // Alternate schema inclusion
          },
        };

        const jobData: WorkerJobData<ExtractJobPayload> = {
          jobId,
          type: 'extract',
          payload,
        };

        const testWorker = fork(workerPath, [], { silent: true });

        testWorker.on('message', (result: WorkerResponse) => {
          try {
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.data.payload.outputFormat).toBe(testCase.outputFormat);
            expect(result.data.payload.options?.compression).toBe(testCase.compression);
            expect(result.data.payload.options?.batchSize).toBe(testCase.batchSize);

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
