// Worker Base Interfaces
export interface BaseWorkerPayload {
  jobId: string;
  type: string;
  workerId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface WorkerJobData<T = any> {
  jobId: string;
  type: string;
  payload: T & BaseWorkerPayload;
}

export interface WorkerResponse {
  success: boolean;
  data: {
    jobId: string;
    type?: string;
    result?: any;
    details?: any;
    payload?: any;
  };
  error?: string;
}

// Specific Worker Payload Interfaces
export interface BackupJobPayload extends BaseWorkerPayload {
  database?: string;
  tables?: string[];
  format?: 'sql' | 'json';
  options?: {
    compress?: boolean;
    encryption?: boolean;
    includeSchema?: boolean;
    excludeData?: boolean;
  };
}

export interface ExtractJobPayload extends BaseWorkerPayload {
  database?: string;
  tables?: string[];
  outputFormat?: 'json' | 'csv' | 'sql';
  outputPath?: string;
  options?: {
    includeSchema?: boolean;
    batchSize?: number;
    compression?: 'none' | 'gzip' | 'zip';
  };
}

export interface FineTuningJobPayload extends BaseWorkerPayload {
  modelId?: string;
  datasetPath?: string;
  trainingConfig?: {
    epochs?: number;
    learningRate?: number;
    batchSize?: number;
    validationSplit?: number;
  };
  options?: {
    saveCheckpoints?: boolean;
    earlyStop?: boolean;
    metrics?: string[];
  };
}

export interface RestoreJobPayload extends BaseWorkerPayload {
  backupUrl: string;
  database?: string;
  tables?: string[];
  options?: {
    overwrite?: boolean;
    validate?: boolean;
    batchSize?: number;
    timeout?: number;
    retryAttempts?: number;
    skipErrors?: boolean;
    compression?: 'none' | 'gzip' | 'bzip2';
    encryption?: {
      enabled: boolean;
      algorithm?: string;
      keyId?: string;
    };
  };
}

export interface GenericJobPayload extends BaseWorkerPayload {
  operation: string;
  parameters?: Record<string, any>;
  options?: {
    timeout?: number;
    retries?: number;
    async?: boolean;
  };
}

// Worker Environment Configuration
export interface WorkerEnvironment {
  jobId?: string;
  jobType?: string;
  jobPayload?: string;
  workerId?: string;
  userId?: string;
}

// Worker Process Response Types
export interface WorkerProcessResult {
  status: 'success' | 'error' | 'no-op';
  data?: any;
  error?: string;
  recordsProcessed?: number;
  tablesProcessed?: string[];
  duration?: string;
  backupFile?: string;
}

// Union type for all job payloads
export type AnyJobPayload = 
  | BackupJobPayload 
  | ExtractJobPayload 
  | FineTuningJobPayload 
  | RestoreJobPayload 
  | GenericJobPayload;