import { fork, ChildProcess } from 'child_process';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { GenericJobPayload, WorkerJobData, WorkerResponse } from '../interfaces/worker.interface';

// Mock UUID to prevent random test failures
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-job-id-123')
}));

describe('Generic Job Worker Tests', () => {
  let worker: ChildProcess;
  const workerPath = path.resolve(__dirname, '../workers/generic.job.worker.ts');

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

  describe('Environment Variable Generic Jobs', () => {
    it('should process extract operation via environment variables', (done) => {
      const jobId = 'generic-env-job-1';
      const jobType = 'extract';
      const payload: GenericJobPayload = {
        jobId,
        type: jobType,
        workerId: 'generic-worker-1',
        userId: 'user-123',
        operation: 'extract',
        parameters: {
          database: 'test_db',
          format: 'json'
        },
        options: {
          timeout: 30000,
          retries: 3,
          async: false
        }
      };

      worker = fork(workerPath, [], {
        env: {
          ...process.env,
          JOB_ID: jobId,
          JOB_TYPE: jobType,
          JOB_PAYLOAD: JSON.stringify(payload),
          WORKER_ID: 'generic-worker-1',
          USER_ID: 'user-123'
        },
        silent: true
      });

      worker.on('message', (result: WorkerResponse) => {
        try {
          expect(result).toBeDefined();
          expect(result.success).toBe(true);
          expect(result.data.jobId).toBe(jobId);
          expect(result.data.type).toBe(jobType);
          expect(result.data.result).toBe('Extract completed successfully');
          expect(result.data.details).toBeDefined();
          expect(result.data.details.status).toBe('success');
          expect(result.data.details.recordsProcessed).toBeGreaterThanOrEqual(0);
          expect(result.data.details.tablesProcessed).toBeInstanceOf(Array);
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

    it('should process no-op operation via environment variables', (done) => {
      const jobId = 'generic-env-job-2';
      const jobType = 'unknown-operation';
      const payload: GenericJobPayload = {
        jobId,
        type: jobType,
        workerId: 'generic-worker-2',
        userId: 'user-456',
        operation: 'unknown-operation',
        parameters: {
          testParam: 'testValue'
        }
      };

      worker = fork(workerPath, [], {
        env: {
          ...process.env,
          JOB_ID: jobId,
          JOB_TYPE: jobType,
          JOB_PAYLOAD: JSON.stringify(payload),
          WORKER_ID: 'generic-worker-2',
          USER_ID: 'user-456'
        },
        silent: true
      });

      worker.on('message', (result: WorkerResponse) => {
        try {
          expect(result).toBeDefined();
          expect(result.success).toBe(true);
          expect(result.data.jobId).toBe(jobId);
          expect(result.data.type).toBe(jobType);
          expect(result.data.result).toBe('No operation performed');
          expect(result.data.details.status).toBe('no-op');
          expect(result.data.details.data.type).toBe('unknown-operation');
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
      const jobId = 'generic-env-job-3';
      const jobType = 'minimal-test';

      worker = fork(workerPath, [], {
        env: {
          ...process.env,
          JOB_ID: jobId,
          JOB_TYPE: jobType,
          WORKER_ID: 'generic-worker-3',
          USER_ID: 'user-789'
          // No JOB_PAYLOAD - should use defaults
        },
        silent: true
      });

      worker.on('message', (result: WorkerResponse) => {
        try {
          expect(result).toBeDefined();
          expect(result.success).toBe(true);
          expect(result.data.jobId).toBe(jobId);
          expect(result.data.type).toBe(jobType);
          expect(result.data.payload.jobId).toBe(jobId);
          expect(result.data.payload.type).toBe(jobType);
          expect(result.data.payload.workerId).toBe('generic-worker-3');
          expect(result.data.payload.userId).toBe('user-789');
          expect(result.data.payload.operation).toBe(jobType); // Should default to jobType
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

  describe('Message-Based Generic Jobs', () => {
    it('should process extract operation via message with detailed parameters', (done) => {
      const jobId = 'generic-msg-job-1';
      const jobType = 'extract';
      const payload: GenericJobPayload = {
        jobId,
        type: jobType,
        workerId: 'msg-generic-worker-1',
        userId: 'msg-user-123',
        operation: 'extract',
        parameters: {
          database: 'analytics_db',
          tables: ['events', 'users', 'sessions'],
          format: 'json',
          includeMetadata: true
        },
        options: {
          timeout: 60000,
          retries: 5,
          async: true
        },
        metadata: {
          requestId: 'req-456',
          priority: 'high',
          scheduled: true
        }
      };

      const jobData: WorkerJobData<GenericJobPayload> = {
        jobId,
        type: jobType,
        payload
      };

      worker = fork(workerPath, [], { silent: true });

      worker.on('message', (result: WorkerResponse) => {
        try {
          expect(result).toBeDefined();
          expect(result.success).toBe(true);
          expect(result.data.jobId).toBe(jobId);
          expect(result.data.type).toBe(jobType);
          expect(result.data.result).toBe('Extract completed successfully');
          expect(result.data.payload).toEqual(payload);
          expect(result.data.payload.metadata).toEqual({
            requestId: 'req-456',
            priority: 'high',
            scheduled: true
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

    it('should handle custom operation via message', (done) => {
      const jobId = 'generic-msg-job-2';
      const jobType = 'custom-processing';
      const payload: GenericJobPayload = {
        jobId,
        type: jobType,
        workerId: 'msg-generic-worker-2',
        userId: 'msg-user-456',
        operation: 'data-transformation',
        parameters: {
          inputFormat: 'csv',
          outputFormat: 'parquet',
          transformations: ['normalize', 'aggregate', 'filter']
        },
        options: {
          timeout: 120000,
          retries: 1,
          async: false
        }
      };

      const jobData: WorkerJobData<GenericJobPayload> = {
        jobId,
        type: jobType,
        payload
      };

      worker = fork(workerPath, [], { silent: true });

      worker.on('message', (result: WorkerResponse) => {
        try {
          expect(result).toBeDefined();
          expect(result.success).toBe(true);
          expect(result.data.result).toBe('No operation performed'); // Custom operations fall through to no-op
          expect(result.data.details.status).toBe('no-op');
          expect(result.data.payload.operation).toBe('data-transformation');
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

  describe('Generic Job Error Handling', () => {
    it('should handle generic job errors gracefully via message', (done) => {
      const jobId = 'generic-error-job-1';
      const jobType = 'extract';
      const payload: GenericJobPayload = {
        jobId: '', // Invalid job ID to trigger error
        type: jobType,
        workerId: 'error-generic-worker-1',
        userId: 'error-user-123',
        operation: 'extract'
      };

      const jobData: WorkerJobData<GenericJobPayload> = {
        jobId,
        type: jobType,
        payload
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

  describe('Generic Job Operation Validation', () => {
    it('should validate different operations and parameters', (done) => {
      const testCases = [
        {
          operation: 'extract',
          parameters: { database: 'test1', format: 'json' },
          expectedResult: 'Extract completed successfully'
        },
        {
          operation: 'transform',
          parameters: { input: 'csv', output: 'json' },
          expectedResult: 'No operation performed'
        },
        {
          operation: 'analyze',
          parameters: { dataset: 'analytics', metrics: ['count', 'avg'] },
          expectedResult: 'No operation performed'
        }
      ];

      let completedTests = 0;
      const totalTests = testCases.length;

      testCases.forEach((testCase, index) => {
        const jobId = `generic-validation-job-${index + 1}`;
        const payload: GenericJobPayload = {
          jobId,
          type: 'generic',
          workerId: `validation-generic-worker-${index + 1}`,
          userId: `validation-user-${index + 1}`,
          operation: testCase.operation,
          parameters: testCase.parameters,
          options: {
            timeout: 30000,
            retries: 2,
            async: false
          }
        };

        const jobData: WorkerJobData<GenericJobPayload> = {
          jobId,
          type: 'generic',
          payload
        };

        const testWorker = fork(workerPath, [], { silent: true });

        testWorker.on('message', (result: WorkerResponse) => {
          try {
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.data.result).toBe(testCase.expectedResult);
            expect(result.data.payload.operation).toBe(testCase.operation);
            expect(result.data.payload.parameters).toEqual(testCase.parameters);
            
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

        setTimeout(() => {
          testWorker.send(jobData);
        }, 100 * (index + 1)); // Stagger the sends
      });

      setTimeout(() => {
        if (completedTests < totalTests) {
          done(new Error(`Test timeout: Only ${completedTests}/${totalTests} tests completed`));
        }
      }, 10000);
    }, 15000);

    it('should handle different timeout and retry configurations', (done) => {
      const testCases = [
        { timeout: 5000, retries: 1, async: false },
        { timeout: 30000, retries: 3, async: true },
        { timeout: 60000, retries: 0, async: false }
      ];

      let completedTests = 0;
      const totalTests = testCases.length;

      testCases.forEach((testCase, index) => {
        const jobId = `generic-config-job-${index + 1}`;
        const payload: GenericJobPayload = {
          jobId,
          type: 'generic-config',
          workerId: `config-generic-worker-${index + 1}`,
          userId: `config-user-${index + 1}`,
          operation: 'extract',
          options: testCase
        };

        const jobData: WorkerJobData<GenericJobPayload> = {
          jobId,
          type: 'generic-config',
          payload
        };

        const testWorker = fork(workerPath, [], { silent: true });

        testWorker.on('message', (result: WorkerResponse) => {
          try {
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.data.payload.options).toEqual(testCase);
            
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

        setTimeout(() => {
          testWorker.send(jobData);
        }, 100 * (index + 1)); // Stagger the sends
      });

      setTimeout(() => {
        if (completedTests < totalTests) {
          done(new Error(`Test timeout: Only ${completedTests}/${totalTests} tests completed`));
        }
      }, 8000);
    }, 12000);
  });
});