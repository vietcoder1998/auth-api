import { prisma } from '../setup';
import { BaseRepository } from './base.repository';

type UIConfigModel = typeof prisma.uiConfig;
type UIConfigDto = {
  id?: string;
  name: string;
  value: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export class UIConfigRepository extends BaseRepository<UIConfigModel, UIConfigDto, UIConfigDto> {
  constructor(uiConfigDelegate = prisma.uiConfig) {
    super(uiConfigDelegate);
  }

  async findByName(name: string) {
    return this.model.findUnique({ where: { name } });
  }

  async findByRole(role: string) {
    return this.model.findMany({ where: { role } });
  }
}
