import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { IToolCommand } from '../interfaces/tool-command.interface';

export class ToolCommandRepository extends BaseRepository<any, IToolCommand, IToolCommand> {
  constructor(prisma: PrismaClient) {
    super(prisma.toolCommand, prisma);
  }
}
