import { PrismaClient } from '@prisma/client';
import { BaseInterface, SearchParams } from '../interfaces';

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
  public override async findById<Dro>(id: string): Promise<Dro | null> {
    // @ts-ignore
    return (this.model as any).findUnique({ where: { id } });
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
  public override async create<Dto, Dro>(data: Dto): Promise<Dro> {
    return (this.model as T | any).create({ data });
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
}
