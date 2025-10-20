// Mock job data for seeding
export const mockJobs = [
  {
    type: 'default',
    name: 'Default Job',
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    result: null,
  },
  {
    type: 'fine-tuning',
    name: 'Fine-tuning Model',
    status: 'completed',
    createdAt: new Date(),
    updatedAt: new Date(),
    result: 'Model fine-tuned successfully.',
  },
  {
    type: 'backup',
    name: 'Database Backup',
    status: 'running',
    createdAt: new Date(),
    updatedAt: new Date(),
    result: null,
  },
  {
    type: 'extract-file',
    name: 'Extract File',
    status: 'failed',
    createdAt: new Date(),
    updatedAt: new Date(),
    result: 'File extraction failed due to missing file.',
  },
];
