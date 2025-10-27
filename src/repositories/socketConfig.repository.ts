import { prisma } from '../setup';
import { BaseRepository } from './base.repository';

type SocketConfigModel = typeof prisma.socketConfig;
type SocketConfigDto = {
  id?: string;
  name: string;
  host: string;
  port: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export class SocketConfigRepository extends BaseRepository<
  SocketConfigModel,
  SocketConfigDto,
  SocketConfigDto
> {
  constructor(socketConfigDelegate = prisma.socketConfig) {
    super(socketConfigDelegate);
  }

  async findByName(name: string) {
    return this.model.findFirst({ where: { name } });
  }

  async findActive() {
    return this.model.findMany({ where: { isActive: true } });
  }
}
