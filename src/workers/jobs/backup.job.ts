import { parentPort, workerData } from 'worker_threads';

// handle job in here

parentPort?.postMessage({
  workerId: workerData.id,
  pid: process.pid,
});