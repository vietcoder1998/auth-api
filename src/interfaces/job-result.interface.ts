import { PrismaClient } from '@prisma/client';

export type JobResultModel = PrismaClient['jobResult'];

export interface JobResultDto extends Partial<PrismaClient['jobResult']> {
  id: string;
  jobId: string;
  status: string;
  result?: any;
  error?: string;
  processingTime?: number;
  metadata?: any;
  createdAt: Date;
  finishedAt?: Date;
}

export interface JobResultDro {
  id: string;
  jobId: string;
  status: string;
  result?: any;
  error?: string | null;
  processingTime?: number | null;
  metadata?: any;
  createdAt: Date;
}

export interface JobResultFilter {
  jobId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}