import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { IToolExplainResult } from '../interfaces/tool-explain-result.interface';

export class ToolExplainResultRepository extends BaseRepository<any, IToolExplainResult, IToolExplainResult> {
  constructor(prisma: PrismaClient) {
    super(prisma.toolExplainResult, prisma);
  }
}
