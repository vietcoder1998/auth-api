import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { IToolExecuteResult } from '../interfaces/tool-execute-result.interface';

export class ToolExecuteResultRepository extends BaseRepository<any, IToolExecuteResult, IToolExecuteResult> {
  constructor(prisma: PrismaClient) {
    super(prisma.toolExecuteResult, prisma);
  }
}
