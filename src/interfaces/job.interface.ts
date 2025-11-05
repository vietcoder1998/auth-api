import { PrismaClient } from "@prisma/client";

export interface JobModel extends Partial<PrismaClient['job']> {
  id: string;
  type: string;
  status: string;
  queueName?: string | null;
  workerId?: string | null;
  payload?: string | null;
  result?: string | null;
  error?: string | null;
  priority?: number;
  retries?: number;
  maxRetries?: number;
  progress?: number;
  timeout?: number | null;
  metadata?: string | null;
  userId?: string | null;
  description?: string | null;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JobDto {
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
}

export interface JobDro {
  id: string;
  type: string;
  status: string;
  queueName?: string | null;
  workerId?: string | null;
  payload?: any;
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