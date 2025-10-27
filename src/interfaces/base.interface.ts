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
    public abstract count<R>(where?: any): Promise<number>;
    public abstract exists<R>(where: any): Promise<boolean>;
    public abstract restore<R>(id: string): Promise<R>;
    public abstract restoreMany<R>(ids: string[]): Promise<R>;
    public abstract hardDelete<R>(id: string): Promise<R>;
    public abstract hardDeleteMany<R>(ids: string[]): Promise<R>;
    public abstract upsert<T, R>(where: any, createData: T, updateData: Partial<T>): Promise<R>;
    public abstract aggregate<R>(params: any): Promise<R>;
    public abstract groupBy<R>(by: string[], params: any): Promise<R[]>;
    public abstract transaction<R>(operations: (() => Promise<any>)[]): Promise<R[]>;       
    public abstract rawQuery<R>(query: string, params?: any[]): Promise<R>;
    public abstract paginate<R>(params: SearchParams, page: number, limit: number): Promise<{
        data: R[];
        total: number;
        page: number;   
        limit: number;

        totalPages: number;
    }>;
    public abstract importFromJson<T, R>(jsonData: T[]): Promise<R[]>;
    public abstract exportToJson<R>(where?: any): Promise<R[]>;
    public abstract clone<R>(id: string, overrides?: Record<string, any>): Promise<R>;
    public abstract bulkCreate<T, R>(data: T[]): Promise<R[]>;
    public abstract bulkUpdate<T, R>(data: { id: string; updates: Partial<T> }[]): Promise<R[]>;
    public abstract bulkDelete<R>(ids: string[]): Promise<number>;
    public abstract bulkSoftDelete<R>(ids: string[]): Promise<number>;
    public abstract bulkRestore<R>(ids: string[]): Promise<number>;
    public abstract bulkHardDelete<R>(ids: string[]): Promise<number>;
    public abstract findOrCreate<T, R>(where: any, createData: T): Promise<R>;
    public abstract countDistinct<R>(field: string, where?: any): Promise<number>;  
    public abstract seed<R>(data: any[]): Promise<R[]>;
    public abstract findByLabel<R>(label: string): Promise<R | null>;
}