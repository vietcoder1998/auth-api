import { PrismaClient } from '@prisma/client';
import { BaseInterface, SearchParams } from '../interfaces';

export class BaseRepository<T> extends BaseInterface {
  protected prisma: PrismaClient;
  protected model: T;

  constructor(model: T, prisma?: PrismaClient) {
    super('', new Date(), new Date()); // Dummy values, subclasses should override
    this.prisma = prisma || new PrismaClient();
    this.model = model;
  }

  public override toJSON<Dto, Dro>(data: Dto): Dro | Record<string, any> {
    if (!data) return {};
    if (typeof (data as any).toJSON === 'function') {
      return (data as any).toJSON();
    }
    return JSON.parse(JSON.stringify(data));
  }

  public override async findById<Dro>(id: string): Promise<Dro | null> {
    // @ts-ignore
    return (this.model as any).findUnique({ where: { id } });
  }

  public override async softDelete<Dro>(id: string): Promise<Dro> {
    // Assumes a 'deleted' or 'isDeleted' boolean field for soft delete
    // @ts-ignore
    return (this.model as any).update({
      where: { id },
      data: { deleted: true },
    });
  }

  public override async search<Dro>(params: SearchParams): Promise<Dro[]> {
    const query = this.buildQueryFromParams(params);
    // @ts-ignore
    return (this.model as any).findMany(query);
  }

  public override buildQueryFromParams(params: SearchParams): Record<string, any> {
    const query: Record<string, any> = {};
    if (params.where) query.where = params.where;
    if (params.orderBy) query.orderBy = params.orderBy;
    if (params.skip) query.skip = params.skip;
    if (params.take) query.take = params.take;
    if (params.include) query.include = params.include;
    if (params.select) query.select = params.select;
    return query;
  }

  public override async create<Dto, Dro>(data: Dto): Promise<Dro> {
    return (this.model as T | any).create({ data });
  }

  public override async update<Dto, Dro>(id: string, data: Partial<Dto>): Promise<Dro> {
    // @ts-ignore
    return (this.model as T | any).update({ where: { id }, data });
  }

  public override async delete<Dro>(id: string): Promise<Dro> {
    // @ts-ignore
    return (this.model as T | any).delete({ where: { id } });
  }
}
