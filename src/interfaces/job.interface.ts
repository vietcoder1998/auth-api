import { PrismaClient } from '@prisma/client';
import { AnyJobPayload } from './worker.interface';

export type JobModel = PrismaClient['job'];

export interface JobDto extends JobModel {
  id?: string;
  type: string;
  status?: string;
  queueName?: string | null;
  workerId?: string | null;
  payload?: string | Record<string, any>;
  result?: string | Record<string, any>;
  error?: string | null;
  priority?: number;
  retries?: number;
  maxRetries?: number;
  progress?: number;
  timeout?: number;
  metadata?: string | Record<string, any>;
  userId?: string | null;
  description?: string | null;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JobDro extends JobDto {
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
  timeout?: number;
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

export interface JobUpdateDto extends Partial<JobCreateDto> {}

export interface JobMQPayloadDto extends Partial<Omit<JobUpdateDto, 'payload'>> {
  jobId: string;
  type: string;
  payload: AnyJobPayload;
  userId?: string;
  priority?: number;
}

export interface JobCreateDto extends Partial<JobDto> {
  id?: string;
  type: string;
  payload?: string;
  userId?: string;
  description?: string;
}
