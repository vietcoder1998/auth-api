import { prisma } from '../setup';
import { BaseRepository } from './base.repository';

type SocketEventModel = typeof prisma.socketEvent;
type SocketEventDto = {
  id?: string;
  socketConfigId: string;
  type: string;
  event: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export class SocketEventRepository extends BaseRepository<
  SocketEventModel,
  SocketEventDto,
  SocketEventDto
> {
  constructor(socketEventDelegate = prisma.socketEvent) {
    super(socketEventDelegate);
  }

  async findBySocketConfig(socketConfigId: string) {
    return this.model.findMany({ where: { socketConfigId } });
  }

  async findByType(type: string) {
    return this.model.findMany({ where: { type } });
  }
}
