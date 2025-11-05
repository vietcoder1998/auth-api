import { PrismaClient } from "@prisma/client";

export type JobModel = PrismaClient['job'];

export interface JobDto extends JobModel{
  id?: string;
  type: string;
  status?: string;
  queueName?: string;
  workerId?: string;
  payload?: string | Record<string, any>;
  result?: string | Record<string, any>;
  error?: string;
  priority?: number;
  retries?: number;
  maxRetries?: number;
  progress?: number;
  timeout?: number;
  metadata?: string | Record<string, any>;
  userId?: string;
  description?: string;
  startedAt?: Date;
  finishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JobDro {
  id: string;
  type: string;
  status: string;
  queueName?: string | null;
  workerId?: string | null;
  payload?: string;
  result?: any;
  error?: string | null;
  priority: number;
  retries: number;
  maxRetries: number;
  progress: number;
  timeout?: number | null;
  metadata?: any;
  userId?: string | null;
  description?: string | null;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled?: number;
}

export interface JobFilter {
  type?: string;
  status?: string;
  queueName?: string;
  workerId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}



export interface JobUpdateDto extends Partial<JobDto> {
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'restart';
  progress?: number;
  result?: any;
  error?: string;
}

export interface JobMQPayloadDto extends JobUpdateDto {
  jobId: string;
  type: string;
  payload: Record<string, any>;
  userId?: string;
  priority?: number;
}
