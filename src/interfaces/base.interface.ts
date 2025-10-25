import { SearchParams } from './search.interface';

export abstract class BaseInterface {
    public id: string;
    public createdAt: Date;
    public updatedAt: Date;
    public deletedAt?: Date | null;

    constructor(id: string, createdAt: Date, updatedAt: Date, deletedAt?: Date | null) {
        this.id = id;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deletedAt = deletedAt;
    }

    public abstract toJSON<T, T1>(data: T): T1 | Record<string, any>;

    // CRUD
    public abstract create<T, R>(data: T): Promise<R>;
    public abstract findById<R>(id: string): Promise<R | null>;
    public abstract update<T, R>(id: string, data: Partial<T>): Promise<R>;
    public abstract delete<R>(id: string): Promise<R>;
    public abstract softDelete<R>(id: string): Promise<R>;
    public abstract search<R>(params: SearchParams): Promise<R[]>;
    public abstract buildQueryFromParams(params: SearchParams): Record<string, any>;

    // Batch operations
    public abstract createMany<T, R>(data: T[]): Promise<R>;
    public abstract updateMany<T, R>(where: any, data: Partial<T>): Promise<R>;
    public abstract deleteMany<R>(where: any): Promise<R>;
    public abstract softDeleteMany<R>(ids: string[]): Promise<R>;
    public abstract findMany<R>(where?: any): Promise<R[]>;
}