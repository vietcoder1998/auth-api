import { ChildProcess, fork } from 'child_process';
import path from 'path';
import {
  FineTuningJobPayload,
  WorkerJobData,
  WorkerResponse,
} from '../interfaces/worker.interface';

// Mock UUID to prevent random test failures
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-job-id-123'),
}));

describe('Fine-Tuning Worker Tests', () => {
  let worker: ChildProcess;
  const workerPath = path.resolve(__dirname, '../workers/fine-tuning.workers.ts');

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

  describe('Environment Variable Fine-Tuning Jobs', () => {
    it('should process fine-tuning job via environment variables with standard config', (done) => {
      const jobId = 'finetune-env-job-1';
      const jobType = 'fine-tuning';
      const payload: FineTuningJobPayload = {
        jobId,
        type: jobType,
        workerId: 'finetune-worker-1',
        userId: 'user-123',
        modelId: 'gpt-3.5-turbo',
        datasetPath: '/data/training/dataset.jsonl',
        trainingConfig: {
          epochs: 3,
          learningRate: 0.001,
          batchSize: 16,
          validationSplit: 0.2,
        },
        options: {
          saveCheckpoints: true,
          earlyStop: true,
          metrics: ['accuracy', 'loss', 'perplexity'],
        },
      };

      worker = fork(workerPath, [], {
        env: {
          ...process.env,
          JOB_ID: jobId,
          JOB_TYPE: jobType,
          JOB_PAYLOAD: JSON.stringify(payload),
          WORKER_ID: 'finetune-worker-1',
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
          expect(result.data.result).toBe('Fine-tuning job completed');
          expect(result.data.payload).toEqual(payload);
          done();
        } catch (error) {
          done(error);
        }
      });

      worker.on('error', done);

      setTimeout(() => {
        done(new Error('Test timeout: Worker did not respond within 10 seconds'));
      }, 10000);
    }, 15000);

    it('should process fine-tuning job via environment variables with advanced config', (done) => {
      const jobId = 'finetune-env-job-2';
      const jobType = 'fine-tuning';
      const payload: FineTuningJobPayload = {
        jobId,
        type: jobType,
        workerId: 'finetune-worker-2',
        userId: 'user-456',
        modelId: 'gpt-4',
        datasetPath: '/data/advanced/multilingual_dataset.jsonl',
        trainingConfig: {
          epochs: 5,
          learningRate: 0.0001,
          batchSize: 32,
          validationSplit: 0.1,
        },
        options: {
          saveCheckpoints: true,
          earlyStop: false,
          metrics: ['accuracy', 'loss', 'bleu_score', 'rouge'],
        },
      };

      worker = fork(workerPath, [], {
        env: {
          ...process.env,
          JOB_ID: jobId,
          JOB_TYPE: jobType,
          JOB_PAYLOAD: JSON.stringify(payload),
          WORKER_ID: 'finetune-worker-2',
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
          expect(result.data.payload.trainingConfig?.epochs).toBe(5);
          expect(result.data.payload.trainingConfig?.batchSize).toBe(32);
          expect(result.data.payload.options?.earlyStop).toBe(false);
          done();
        } catch (error) {
          done(error);
        }
      });

      worker.on('error', done);

      setTimeout(() => {
        done(new Error('Test timeout: Worker did not respond within 10 seconds'));
      }, 10000);
    }, 15000);

    it('should handle minimal payload in environment variables', (done) => {
      const jobId = 'finetune-env-job-3';
      const jobType = 'fine-tuning';

      worker = fork(workerPath, [], {
        env: {
          ...process.env,
          JOB_ID: jobId,
          JOB_TYPE: jobType,
          WORKER_ID: 'finetune-worker-3',
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
          expect(result.data.payload.workerId).toBe('finetune-worker-3');
          expect(result.data.payload.userId).toBe('user-789');
          done();
        } catch (error) {
          done(error);
        }
      });

      worker.on('error', done);

      setTimeout(() => {
        done(new Error('Test timeout: Worker did not respond within 10 seconds'));
      }, 10000);
    }, 15000);
  });

  describe('Message-Based Fine-Tuning Jobs', () => {
    it('should process fine-tuning job via message with custom model', (done) => {
      const jobId = 'finetune-msg-job-1';
      const jobType = 'fine-tuning';
      const payload: FineTuningJobPayload = {
        jobId,
        type: jobType,
        workerId: 'msg-finetune-worker-1',
        userId: 'msg-user-123',
        modelId: 'custom-bert-base',
        datasetPath: '/data/custom/domain_specific.jsonl',
        trainingConfig: {
          epochs: 10,
          learningRate: 0.00001,
          batchSize: 8,
          validationSplit: 0.15,
        },
        options: {
          saveCheckpoints: true,
          earlyStop: true,
          metrics: ['f1_score', 'precision', 'recall'],
        },
        metadata: {
          experiment: 'domain_adaptation_v2',
          baseline_model: 'bert-base-uncased',
          task: 'classification',
        },
      };

      const jobData: WorkerJobData<FineTuningJobPayload> = {
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
          expect(result.data.result).toBe('Fine-tuning job completed');
          expect(result.data.payload).toEqual(payload);
          expect(result.data.payload.metadata).toEqual({
            experiment: 'domain_adaptation_v2',
            baseline_model: 'bert-base-uncased',
            task: 'classification',
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
        done(new Error('Test timeout: Worker did not respond within 10 seconds'));
      }, 10000);
    }, 15000);

    it('should handle fine-tuning job with large batch configuration', (done) => {
      const jobId = 'finetune-msg-job-2';
      const jobType = 'fine-tuning';
      const payload: FineTuningJobPayload = {
        jobId,
        type: jobType,
        workerId: 'msg-finetune-worker-2',
        userId: 'msg-user-456',
        modelId: 'llama-2-7b',
        datasetPath: '/data/large/instruction_tuning.jsonl',
        trainingConfig: {
          epochs: 1,
          learningRate: 0.0003,
          batchSize: 64, // Large batch size
          validationSplit: 0.05,
        },
        options: {
          saveCheckpoints: true,
          earlyStop: false, // No early stopping for large jobs
          metrics: ['perplexity', 'token_accuracy'],
        },
      };

      const jobData: WorkerJobData<FineTuningJobPayload> = {
        jobId,
        type: jobType,
        payload,
      };

      worker = fork(workerPath, [], { silent: true });

      worker.on('message', (result: WorkerResponse) => {
        try {
          expect(result).toBeDefined();
          expect(result.success).toBe(true);
          expect(result.data.payload.trainingConfig?.batchSize).toBe(64);
          expect(result.data.payload.options?.earlyStop).toBe(false);
          expect(result.data.payload.modelId).toBe('llama-2-7b');
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
        done(new Error('Test timeout: Worker did not respond within 10 seconds'));
      }, 10000);
    }, 15000);
  });

  describe('Fine-Tuning Job Error Handling', () => {
    it('should handle fine-tuning errors gracefully via message', (done) => {
      const jobId = 'finetune-error-job-1';
      const jobType = 'fine-tuning';
      const payload: FineTuningJobPayload = {
        jobId: '', // Invalid job ID to trigger error
        type: jobType,
        workerId: 'error-finetune-worker-1',
        userId: 'error-user-123',
      };

      const jobData: WorkerJobData<FineTuningJobPayload> = {
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
        done(new Error('Test timeout: Worker did not respond within 10 seconds'));
      }, 10000);
    }, 15000);
  });

  describe('Fine-Tuning Job Validation', () => {
    it('should validate different model configurations and training parameters', (done) => {
      const testCases = [
        {
          modelId: 'gpt-3.5-turbo',
          epochs: 3,
          learningRate: 0.001,
          batchSize: 16,
        },
        {
          modelId: 'claude-2',
          epochs: 5,
          learningRate: 0.0001,
          batchSize: 32,
        },
        {
          modelId: 'custom-transformer',
          epochs: 8,
          learningRate: 0.00005,
          batchSize: 8,
        },
      ];

      let completedTests = 0;
      const totalTests = testCases.length;

      testCases.forEach((testCase, index) => {
        const jobId = `finetune-validation-job-${index + 1}`;
        const payload: FineTuningJobPayload = {
          jobId,
          type: 'fine-tuning',
          workerId: `validation-finetune-worker-${index + 1}`,
          userId: `validation-user-${index + 1}`,
          modelId: testCase.modelId,
          trainingConfig: {
            epochs: testCase.epochs,
            learningRate: testCase.learningRate,
            batchSize: testCase.batchSize,
            validationSplit: 0.1,
          },
          options: {
            saveCheckpoints: index % 2 === 0, // Alternate checkpoint saving
            earlyStop: index % 3 === 0, // Alternate early stopping
            metrics: ['accuracy', 'loss'],
          },
        };

        const jobData: WorkerJobData<FineTuningJobPayload> = {
          jobId,
          type: 'fine-tuning',
          payload,
        };

        const testWorker = fork(workerPath, [], { silent: true });

        testWorker.on('message', (result: WorkerResponse) => {
          try {
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.data.payload.modelId).toBe(testCase.modelId);
            expect(result.data.payload.trainingConfig?.epochs).toBe(testCase.epochs);
            expect(result.data.payload.trainingConfig?.learningRate).toBe(testCase.learningRate);
            expect(result.data.payload.trainingConfig?.batchSize).toBe(testCase.batchSize);

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
      }, 15000);
    }, 20000);
  });
});
