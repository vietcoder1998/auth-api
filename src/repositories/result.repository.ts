import { PrismaClient, Result } from '@prisma/client';

export class ResultRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<Result>) {
    return this.prisma.result.create({ data });
  }

  async findAll() {
    return this.prisma.result.findMany();
  }

  async findById(id: string) {
    return this.prisma.result.findUnique({ where: { id } });
  }

  async update(id: string, data: Partial<Result>) {
    return this.prisma.result.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.result.delete({ where: { id } });
  }
}
