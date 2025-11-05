const { fork } = require('child_process');
const path = require('path');

console.log('Testing worker fork functionality...');

// Test the generic worker
const workerPath = path.resolve(__dirname, 'src/workers/generic.job.worker.js');
const worker = fork(workerPath, [], {
  env: {
    ...process.env,
    JOB_ID: 'test-job-123',
    JOB_TYPE: 'extract',
    JOB_PAYLOAD: JSON.stringify({ test: 'data' }),
    WORKER_ID: 'test-worker-456'
  }
});

// Listen for messages from worker
worker.on('message', (result) => {
  console.log('Received message from worker:', result);
  worker.kill();
  console.log('Test completed successfully!');
});

// Handle worker errors
worker.on('error', (error) => {
  console.error('Worker error:', error);
  worker.kill();
});

// Handle worker exit
worker.on('exit', (code) => {
  console.log(`Worker exited with code: ${code}`);
});

// Send a test job
worker.send({
  jobId: 'test-job-123',
  type: 'extract',
  payload: { test: 'data' },
  workerId: 'test-worker-456'
});

// Timeout for test
setTimeout(() => {
  console.log('Test timeout reached, killing worker...');
  worker.kill();
}, 10000);