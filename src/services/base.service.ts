import { BaseRepository } from "../repositories";

export class BaseService<T, Dto, Dro> {
    protected repository: BaseRepository<T, Dto, Dro>;

    constructor(repository: BaseRepository<T, Dto, Dro>) {
        this.repository = repository;
    }

    async findAll(): Promise<Dro[]> {
        return this.repository.search<Dro>({});
    }

    async findOne(id: string): Promise<Dro | null> {
        return this.repository.findById<Dro>(id);
    }

    async create(data: Dto): Promise<Dro> {
        return this.repository.create<Dto, Dro>(data);
    }

    async update(id: string, data: Partial<Dto>): Promise<Dro | null> {
        return this.repository.update<Dto, Dro>(id, data);
    }

    async delete(id: string): Promise<Dro> {
        return this.repository.delete<Dro>(id);
    }

    async softDelete(id: string): Promise<Dro> {
        return this.repository.softDelete<Dro>(id);
    }

    // Batch operations
    async createMany(data: Dto[]): Promise<{ count: number }> {
        return this.repository.createMany<Dto, { count: number }>(data);
    }

    async updateMany(where: any, data: Partial<Dto>): Promise<{ count: number }> {
        return this.repository.updateMany<Dto, { count: number }>(where, data);
    }

    async deleteMany(where: any): Promise<{ count: number }> {
        return this.repository.deleteMany<{ count: number }>(where);
    }

    async softDeleteMany(ids: string[]): Promise<{ count: number }> {
        return this.repository.softDeleteMany<{ count: number }>(ids);
    }

    async findMany(where?: any): Promise<Dro[]> {
        return this.repository.findMany<Dro>(where);
    }
}