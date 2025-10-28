import { PrismaClient } from '@prisma/client';
import { BaseInterface, SearchParams } from '../interfaces';
import prisma from '../prisma';

/**
 * BaseRepository - Generic repository pattern implementation for data access layer
 *
 * Provides common CRUD operations and batch processing for all entity repositories.
 * All entity-specific repositories should extend this class.
 *
 * @template T - The Prisma model delegate type
 * @template Dto - Data Transfer Object type for input operations
 * @template Dro - Data Response Object type for output operations
 *
 * @example
 * ```typescript
 * export class UserRepository extends BaseRepository<UserModel, UserDto, UserDto> {
 *   constructor(userDelegate = prisma.user) {
 *     super(userDelegate);
 *   }
 * }
 * ```
 */
export class BaseRepository<T, Dto, Dro> extends BaseInterface {
  protected prisma: PrismaClient;
  protected model: T;

  /**
   * Creates a new repository instance
   * @param model - Prisma model delegate (e.g., prisma.user)
   * @param prisma - Optional PrismaClient instance (uses default if not provided)
   */
  constructor(model: T, prisma?: PrismaClient) {
    super('', new Date(), new Date()); // Dummy values, subclasses should override
    this.prisma = prisma || new PrismaClient();
    this.model = model;
  }

  /**
   * Converts data to JSON format
   * @param data - Data to convert
   * @returns JSON representation of the data
   */
  public override toJSON<Dto, Dro>(data: Dto): Dro | Record<string, any> {
    if (!data) return {};
    if (typeof (data as any).toJSON === 'function') {
      return (data as any).toJSON();
    }
    return JSON.parse(JSON.stringify(data));
  }

  /**
   * Find a single record by its ID
   * @param id - The unique identifier of the record
   * @returns The found record or null if not found
   * @example
   * ```typescript
   * const user = await userRepo.findById('123');
   * ```
   */
  public override async findById<Dro>(id: string, condition?: any): Promise<Dro | null> {
    // @ts-ignore
    return (this.model as any).findUnique({ where: { id }, ...condition });
  }

  /**
   * Soft delete a record by setting its 'deleted' flag to true
   * Note: Requires the model to have a 'deleted' boolean field
   * @param id - The unique identifier of the record to soft delete
   * @returns The updated record
   * @example
   * ```typescript
   * const deletedUser = await userRepo.softDelete('123');
   * ```
   */
  public override async softDelete<Dro>(id: string): Promise<Dro> {
    // Assumes a 'deleted' or 'isDeleted' boolean field for soft delete
    // @ts-ignore
    return (this.model as any).update({
      where: { id },
      data: { deleted: true },
    });
  }

  /**
   * Search for records using custom parameters
   * @param params - Search parameters including where, orderBy, pagination, etc.
   * @returns Array of matching records
   * @example
   * ```typescript
   * const users = await userRepo.search({
   *   where: { status: 'active' },
   *   orderBy: { createdAt: 'desc' },
   *   take: 10,
   *   skip: 0
   * });
   * ```
   */
  public override async search<Dro>(params: SearchParams): Promise<Dro[]> {
    const query = this.buildQueryFromParams(params);
    // @ts-ignore
    return (this.model as any).findMany(query);
  }

  /**
   * Build Prisma query object from search parameters
   * @param params - Search parameters
   * @returns Prisma-compatible query object
   * @internal
   */
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

  /**
   * Create a new record
   * @param data - Data for creating the record
   * @returns The created record
   * @example
   * ```typescript
   * const newUser = await userRepo.create({
   *   email: 'user@example.com',
   *   name: 'John Doe'
   * });
   * ```
   */
  public override async create<T=any, R=any>(data: T): Promise<R> {
    return (this.model as any).create({ data });
  }

  /**
   * Update an existing record by ID
   * @param id - The unique identifier of the record to update
   * @param data - Partial data to update
   * @returns The updated record
   * @example
   * ```typescript
   * const updatedUser = await userRepo.update('123', {
   *   name: 'Jane Doe'
   * });
   * ```
   */
  public override async update<Dto, Dro>(id: string, data: Partial<Dto>): Promise<Dro> {
    // @ts-ignore
    return (this.model as T | any).update({ where: { id }, data });
  }

  /**
   * Permanently delete a record by ID
   * @param id - The unique identifier of the record to delete
   * @returns The deleted record
   * @example
   * ```typescript
   * const deletedUser = await userRepo.delete('123');
   * ```
   */
  public override async delete<Dro>(id: string): Promise<Dro> {
    // @ts-ignore
    return (this.model as T | any).delete({ where: { id } });
  }

  // ==================== BATCH OPERATIONS ====================

  /**
   * Create multiple records in a single operation
   * @param data - Array of data objects to create
   * @returns Batch operation result with count of created records
   * @example
   * ```typescript
   * const result = await userRepo.createMany([
   *   { email: 'user1@example.com', name: 'User 1' },
   *   { email: 'user2@example.com', name: 'User 2' }
   * ]);
   * console.log(result.count); // 2
   * ```
   */
  public override async createMany<Dto, Dro>(data: Dto[]): Promise<Dro> {
    // @ts-ignore
    return (this.model as T | any).createMany({ data, skipDuplicates: true });
  }

  /**
   * Update multiple records that match the where condition
   * @param where - Condition to match records for update
   * @param data - Partial data to update on all matching records
   * @returns Batch operation result with count of updated records
   * @example
   * ```typescript
   * const result = await userRepo.updateMany(
   *   { status: 'pending' },
   *   { status: 'active' }
   * );
   * console.log(result.count); // Number of users updated
   * ```
   */
  public override async updateMany<Dto, Dro>(where: any, data: Partial<Dto>): Promise<Dro> {
    // @ts-ignore
    return (this.model as T | any).updateMany({ where, data });
  }

  /**
   * Delete multiple records that match the where condition
   * @param where - Condition to match records for deletion
   * @returns Batch operation result with count of deleted records
   * @example
   * ```typescript
   * const result = await userRepo.deleteMany({
   *   status: 'inactive',
   *   lastLoginAt: { lt: new Date('2024-01-01') }
   * });
   * console.log(result.count); // Number of users deleted
   * ```
   */
  public override async deleteMany<Dro>(where: any): Promise<Dro> {
    // @ts-ignore
    return (this.model as T | any).deleteMany({ where });
  }

  /**
   * Soft delete multiple records by their IDs
   * Note: Requires the model to have a 'deleted' boolean field
   * @param ids - Array of record IDs to soft delete
   * @returns Batch operation result with count of soft-deleted records
   * @example
   * ```typescript
   * const result = await userRepo.softDeleteMany(['id1', 'id2', 'id3']);
   * console.log(result.count); // 3
   * ```
   */
  public override async softDeleteMany<Dro>(ids: string[]): Promise<Dro> {
    // @ts-ignore
    return (this.model as T | any).updateMany({
      where: { id: { in: ids } },
      data: { deleted: true },
    });
  }

  /**
   * Count records matching the where condition
   * @param where - Optional condition to filter records
   * @returns Count of matching records
   * @example
   * ```typescript
   * const activeUserCount = await userRepo.count({ status: 'active' });
   * ```
   */
  public override async count(where?: any): Promise<number> {
    // @ts-ignore
    return (this.model as T | any).count({ where });
  }

  /**
   * Check if any record exists matching the where condition
   * @param where - Condition to check for existence
   * @returns True if at least one record exists, false otherwise
   * @example
   * ```typescript
   * const hasActiveUsers = await userRepo.exists({ status: 'active' });
   * ```
   */
  public override async exists(where: any): Promise<boolean> {
    // @ts-ignore
    const count = await (this.model as T | any).count({ where });
    return count > 0;
  }

  /**
   * Restore a soft-deleted record by ID
   * @param id - ID of record to restore
   * @returns Restored record
   * @example
   * ```typescript
   * const restoredUser = await userRepo.restore('123');
   * ```
   */
  public override async restore<Dro>(id: string): Promise<Dro> {
    // @ts-ignore
    return (this.model as T | any).update({
      where: { id },
      data: { deleted: false },
    });
  }

  /**
   * Restore multiple soft-deleted records
   * @param ids - Array of record IDs to restore
   * @returns Batch operation result with count of restored records
   * @example
   * ```typescript
   * const result = await userRepo.restoreMany(['id1', 'id2']);
   * console.log(result.count); // 2
   * ```
   */
  public override async restoreMany<Dro>(ids: string[]): Promise<Dro> {
    // @ts-ignore
    return (this.model as T | any).updateMany({
      where: { id: { in: ids } },
      data: { deleted: false },
    });
  }

  /**
   * Permanently delete a record (hard delete)
   * @param id - ID of record to permanently delete
   * @returns Deleted record
   * @example
   * ```typescript
   * const deletedUser = await userRepo.hardDelete('123');
   * ```
   */
  public override async hardDelete<Dro>(id: string): Promise<Dro> {
    return this.delete<Dro>(id);
  }

  /**
   * Permanently delete multiple records (hard delete)
   * @param ids - Array of record IDs to permanently delete
   * @returns Batch operation result with count of deleted records
   * @example
   * ```typescript
   * const result = await userRepo.hardDeleteMany(['id1', 'id2']);
   * console.log(result.count); // 2
   * ```
   */
  public override async hardDeleteMany<Dro>(ids: string[]): Promise<Dro> {
    return this.deleteMany<Dro>({ id: { in: ids } });
  }

  /**
   * Aggregate data using Prisma aggregation functions
   * @param params - Aggregation parameters (sum, avg, count, etc.)
   * @returns Aggregated result
   * @example
   * ```typescript
   * const stats = await userRepo.aggregate({
   *   _count: true,
   *   _avg: { age: true },
   *   where: { status: 'active' }
   * });
   * ```
   */
  public override async aggregate<Dro>(params: any): Promise<Dro> {
    // @ts-ignore
    return (this.model as T | any).aggregate(params);
  }

  /**
   * Group records by specified fields
   * @param by - Array of field names to group by
   * @param params - Additional groupBy parameters
   * @returns Array of grouped results
   * @example
   * ```typescript
   * const usersByStatus = await userRepo.groupBy(['status'], {
   *   _count: true
   * });
   * ```
   */
  public override async groupBy<Dro>(by: string[], params: any): Promise<Dro[]> {
    // @ts-ignore
    return (this.model as T | any).groupBy({
      by,
      ...params,
    });
  }

  /**
   * Execute multiple operations in a transaction
   * @param operations - Array of async operations to execute
   * @returns Array of operation results
   * @example
   * ```typescript
   * const results = await userRepo.transaction([
   *   () => userRepo.create({ email: 'user1@example.com' }),
   *   () => userRepo.update('123', { status: 'active' })
   * ]);
   * ```
   */
  public override async transaction<Dro>(operations: (() => Promise<any>)[]): Promise<Dro[]> {
    return this.prisma.$transaction(async (tx) => {
      const results: any[] = [];
      for (const op of operations) {
        results.push(await op());
      }
      return results;
    });
  }

  /**
   * Execute raw SQL query
   * @param query - SQL query string
   * @param params - Optional query parameters
   * @returns Query results
   * @example
   * ```typescript
   * const users = await userRepo.rawQuery(
   *   'SELECT * FROM users WHERE status = $1',
   *   ['active']
   * );
   * ```
   */
  public override async rawQuery<Dro>(query: string, params?: any[]): Promise<Dro> {
    // @ts-ignore
    return this.prisma.$queryRawUnsafe(query, ...(params || []));
  }

  /**
   * Paginate search results
   * @param params - Search parameters
   * @param page - Page number (1-based)
   * @param limit - Records per page
   * @returns Paginated result with data and metadata
   * @example
   * ```typescript
   * const result = await userRepo.paginate(
   *   { where: { status: 'active' } },
   *   1,
   *   10
   * );
   * console.log(result.data); // Array of 10 users
   * console.log(result.totalPages); // Total number of pages
   * ```
   */
  public override async paginate<Dro>(
    params: SearchParams,
    page: number,
    limit: number,
  ): Promise<{
    data: Dro[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const query = this.buildQueryFromParams({ ...params, skip, take: limit });

    // @ts-ignore
    const [data, total] = await Promise.all([
      (this.model as T | any).findMany(query),
      (this.model as T | any).count({ where: params.where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find multiple records with optional filtering
   * @param where - Optional condition to filter records
   * @returns Array of matching records
   * @example
   * ```typescript
   * // Find all active users
   * const activeUsers = await userRepo.findMany({ status: 'active' });
   *
   * // Find all records
   * const allUsers = await userRepo.findMany();
   * ```
   */
  public override async findMany<Dro>(where?: any): Promise<Dro[]> {
    // @ts-ignore
    return (this.model as T | any).findMany({ where });
  }

  // ==================== UPSERT OPERATIONS ====================

  /**
   * Create or update a single record based on a unique field
   * @param where - Unique field(s) to search for existing record
   * @param create - Data to use if creating a new record
   * @param update - Data to use if updating an existing record
   * @returns The created or updated record
   * @example
   * ```typescript
   * const user = await userRepo.upsert(
   *   { email: 'user@example.com' },
   *   { email: 'user@example.com', name: 'John Doe', status: 'active' },
   *   { name: 'John Doe Updated' }
   * );
   * ```
   */
  public override async upsert<Dto, Dro>(
    where: Record<string, any>,
    create: Dto,
    update: Partial<Dto>,
  ): Promise<Dro> {
    // @ts-ignore
    return (this.model as T | any).upsert({
      where,
      create,
      update,
    });
  }

  /**
   * Create or update multiple records in batch
   * For each item, searches by unique field and creates/updates accordingly
   * Note: This executes multiple upsert operations, not a single batch operation
   * @param items - Array of upsert configurations
   * @returns Array of created or updated records
   * @example
   * ```typescript
   * const users = await userRepo.upsertMany([
   *   {
   *     where: { email: 'user1@example.com' },
   *     create: { email: 'user1@example.com', name: 'User 1' },
   *     update: { name: 'User 1 Updated' }
   *   },
   *   {
   *     where: { email: 'user2@example.com' },
   *     create: { email: 'user2@example.com', name: 'User 2' },
   *     update: { name: 'User 2 Updated' }
   *   }
   * ]);
   * ```
   */
  public async upsertMany<Dto, Dro>(
    items: Array<{
      where: Record<string, any>;
      create: Dto;
      update: Partial<Dto>;
    }>,
  ): Promise<Dro[]> {
    const results: Dro[] = [];
    for (const item of items) {
      // @ts-ignore
      const result = await (this.model as T | any).upsert({
        where: item.where,
        create: item.create,
        update: item.update,
      });
      results.push(result);
    }
    return results;
  }

  // ==================== IMPORT/EXPORT OPERATIONS ====================

  /**
   * Import records from JSON data
   * @param jsonData - Array of JSON objects to import
   * @returns Array of created records
   */
  public async importFromJson<TData, Dro>(jsonData: TData[]): Promise<Dro[]> {
    const results: Dro[] = [];
    for (const data of jsonData) {
      // @ts-ignore
      const result = await (this.model as T | any).create({ data });
      results.push(result);
    }
    return results;
  }

  /**
   * Export records to JSON format
   * @param where - Optional filter condition
   * @returns Array of records in JSON format
   */
  public async exportToJson<Dro>(where?: any): Promise<Dro[]> {
    // @ts-ignore
    return (this.model as T | any).findMany({ where });
  }

  // ==================== CLONE OPERATIONS ====================

  /**
   * Clone an existing record with optional overrides
   * @param id - ID of record to clone
   * @param overrides - Optional field overrides
   * @returns Cloned record
   */
  public async clone<Dro>(id: string, overrides?: Record<string, any>): Promise<Dro> {
    // @ts-ignore
    const original = await (this.model as T | any).findUnique({ where: { id } });
    if (!original) throw new Error('Record not found');

    const { id: _, createdAt, updatedAt, ...cloneData } = original;
    const newData = { ...cloneData, ...overrides };

    // @ts-ignore
    return (this.model as T | any).create({ data: newData });
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Bulk create records
   * @param data - Array of records to create
   * @returns Array of created records
   */
  public async bulkCreate<TData, Dro>(data: TData[]): Promise<Dro[]> {
    const results: Dro[] = [];
    for (const item of data) {
      // @ts-ignore
      const result = await (this.model as T | any).create({ data: item });
      results.push(result);
    }
    return results;
  }

  /**
   * Bulk update records
   * @param data - Array of update operations with id and updates
   * @returns Array of updated records
   */
  public async bulkUpdate<TData, Dro>(
    data: { id: string; updates: Partial<TData> }[],
  ): Promise<Dro[]> {
    const results: Dro[] = [];
    for (const item of data) {
      // @ts-ignore
      const result = await (this.model as T | any).update({
        where: { id: item.id },
        data: item.updates,
      });
      results.push(result);
    }
    return results;
  }

  /**
   * Bulk delete records by IDs
   * @param ids - Array of record IDs to delete
   * @returns Number of deleted records
   */
  public async bulkDelete(ids: string[]): Promise<number> {
    // @ts-ignore
    const result = await (this.model as T | any).deleteMany({
      where: { id: { in: ids } },
    });
    return result.count;
  }

  /**
   * Bulk soft delete records by IDs
   * @param ids - Array of record IDs to soft delete
   * @returns Number of soft deleted records
   */
  public async bulkSoftDelete(ids: string[]): Promise<number> {
    // @ts-ignore
    const result = await (this.model as T | any).updateMany({
      where: { id: { in: ids } },
      data: { deleted: true },
    });
    return result.count;
  }

  /**
   * Bulk restore soft deleted records
   * @param ids - Array of record IDs to restore
   * @returns Number of restored records
   */
  public async bulkRestore(ids: string[]): Promise<number> {
    // @ts-ignore
    const result = await (this.model as T | any).updateMany({
      where: { id: { in: ids } },
      data: { deleted: false },
    });
    return result.count;
  }

  /**
   * Bulk hard delete records (permanent)
   * @param ids - Array of record IDs to permanently delete
   * @returns Number of deleted records
   */
  public async bulkHardDelete(ids: string[]): Promise<number> {
    return this.bulkDelete(ids);
  }

  // ==================== UTILITY OPERATIONS ====================

  /**
   * Find or create a record
   * @param where - Search criteria
   * @param createData - Data to create if not found
   * @returns Found or created record
   */
  public async findOrCreate<TData, Dro>(where: any, createData: TData): Promise<Dro> {
    // @ts-ignore
    const existing = await (this.model as T | any).findFirst({ where });
    if (existing) return existing;

    // @ts-ignore
    return (this.model as T | any).create({ data: createData });
  }

  /**
   * Count distinct values in a field
   * @param field - Field name to count distinct values
   * @param where - Optional filter condition
   * @returns Count of distinct values
   */
  public async countDistinct(field: string, where?: any): Promise<number> {
    // @ts-ignore
    const results = await (this.model as T | any).findMany({
      where,
      select: { [field]: true },
      distinct: [field],
    });
    return results.length;
  }

  /**
   * Seed database with initial data
   * @param data - Array of seed data
   * @returns Array of created records
   */
  public async seed<Dro>(data: any[]): Promise<Dro[]> {
    const results: Dro[] = [];
    for (const item of data) {
      try {
        // @ts-ignore
        const result = await (this.model as T | any).upsert({
          where: item.where || { id: item.id },
          create: item.create || item,
          update: item.update || {},
        });
        results.push(result);
      } catch (error) {
        console.error(`Seed error for item:`, error);
      }
    }
    return results;
  }

  public async findByLabel<R>(label: string, type: string): Promise<R | null> {
    const entityLabel = await prisma.entityLabel.findFirst({
      where: {
        entityType: type,
        label: {
          name: label, // 👈 match theo label.name
        },
      },
    });
    if (!entityLabel) return null;

    const foundRecord = await (this.model as T | any).findMany({
      where: { id: entityLabel.entityId },
    });

    return foundRecord || null;
  }

  protected async findOne(id: string){
    const entity = await (this.model as T | any).findUnique({ where: { id } });

    return entity;
  }
}
