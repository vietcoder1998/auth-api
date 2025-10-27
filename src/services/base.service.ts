import { BaseRepository } from "../repositories";

/**
 * BaseService - Generic service layer pattern implementation for business logic
 * 
 * Provides common CRUD operations and delegates to repository layer for data access.
 * All entity-specific services should extend this class.
 * 
 * @template T - The Prisma model delegate type
 * @template Dto - Data Transfer Object type for input operations
 * @template Dro - Data Response Object type for output operations
 * 
 * @example
 * ```typescript
 * export class UserService extends BaseService<UserModel, UserDto, UserDto> {
 *   constructor() {
 *     const userRepository = new UserRepository();
 *     super(userRepository);
 *   }
 *   
 *   // Add custom business logic methods
 *   async activateUser(userId: string) {
 *     return this.update(userId, { status: 'active' });
 *   }
 * }
 * ```
 */
export class BaseService<T, Dto, Dro> {
    protected repository: BaseRepository<T, Dto, Dro>;

    /**
     * Creates a new service instance
     * @param repository - Repository instance for data access
     */
    constructor(repository: BaseRepository<T, Dto, Dro>) {
        this.repository = repository;
    }

    /**
     * Find all records
     * @returns Array of all records
     * @example
     * ```typescript
     * const allUsers = await userService.findAll();
     * ```
     */
    async findAll(where?: Record<string, any>): Promise<Dro[]> {
        return this.repository.search<Dro>(where || {});
    }

    /**
     * Find a single record by its ID
     * @param id - The unique identifier of the record
     * @returns The found record or null if not found
     * @example
     * ```typescript
     * const user = await userService.findOne('123');
     * if (!user) {
     *   throw new Error('User not found');
     * }
     * ```
     */
    async findOne(id: string): Promise<Dro | null> {
        return this.repository.findById<Dro>(id);
    }

    /**
     * Create a new record
     * @param data - Data for creating the record
     * @returns The created record
     * @example
     * ```typescript
     * const newUser = await userService.create({
     *   email: 'user@example.com',
     *   name: 'John Doe',
     *   status: 'active'
     * });
     * ```
     */
    async create(data: Dto): Promise<Dro> {
        return this.repository.create<Dto, Dro>(data);
    }

    /**
     * Update an existing record by ID
     * @param id - The unique identifier of the record to update
     * @param data - Partial data to update
     * @returns The updated record or null if not found
     * @example
     * ```typescript
     * const updated = await userService.update('123', {
     *   name: 'Jane Doe',
     *   status: 'inactive'
     * });
     * ```
     */
    async update(id: string, data: Partial<Dto>): Promise<Dro | null> {
        return this.repository.update<Dto, Dro>(id, data);
    }

    /**
     * Permanently delete a record by ID
     * @param id - The unique identifier of the record to delete
     * @returns The deleted record
     * @example
     * ```typescript
     * const deleted = await userService.delete('123');
     * ```
     */
    async delete(id: string): Promise<Dro> {
        return this.repository.delete<Dro>(id);
    }

    /**
     * Soft delete a record by setting its 'deleted' flag to true
     * Note: Requires the model to have a 'deleted' boolean field
     * @param id - The unique identifier of the record to soft delete
     * @returns The updated record
     * @example
     * ```typescript
     * const deleted = await userService.softDelete('123');
     * // Record is marked as deleted but still exists in database
     * ```
     */
    async softDelete(id: string): Promise<Dro> {
        return this.repository.softDelete<Dro>(id);
    }

    // ==================== BATCH OPERATIONS ====================

    /**
     * Create multiple records in a single operation
     * @param data - Array of data objects to create
     * @returns Object with count of created records
     * @example
     * ```typescript
     * const result = await userService.createMany([
     *   { email: 'user1@example.com', name: 'User 1' },
     *   { email: 'user2@example.com', name: 'User 2' }
     * ]);
     * console.log(`Created ${result.count} users`);
     * ```
     */
    async createMany(data: Dto[]): Promise<{ count: number }> {
        return this.repository.createMany<Dto, { count: number }>(data);
    }

    /**
     * Update multiple records that match the where condition
     * @param where - Filter condition to match records (Prisma WhereInput)
     * @param data - Partial data to update on all matching records
     * @returns Object with count of updated records
     * @example
     * ```typescript
     * // Activate all pending users
     * const result = await userService.updateMany(
     *   { status: 'pending' },
     *   { status: 'active' }
     * );
     * console.log(`Updated ${result.count} users`);
     * ```
     */
    async updateMany(where: Record<string, any>, data: Partial<Dto>): Promise<{ count: number }> {
        return this.repository.updateMany<Dto, { count: number }>(where, data);
    }

    /**
     * Delete multiple records that match the where condition
     * @param where - Filter condition to match records (Prisma WhereInput)
     * @returns Object with count of deleted records
     * @example
     * ```typescript
     * const result = await userService.deleteMany({
     *   status: 'inactive',
     *   lastLoginAt: { lt: new Date('2024-01-01') }
     * });
     * console.log(`Deleted ${result.count} users`);
     * ```
     */
    async deleteMany(where: Record<string, any>): Promise<{ count: number }> {
        return this.repository.deleteMany<{ count: number }>(where);
    }

    /**
     * Soft delete multiple records by their IDs
     * Note: Requires the model to have a 'deleted' boolean field
     * @param ids - Array of record IDs to soft delete
     * @returns Object with count of soft-deleted records
     * @example
     * ```typescript
     * const result = await userService.softDeleteMany(['id1', 'id2', 'id3']);
     * console.log(`Soft deleted ${result.count} users`);
     * ```
     */
    async softDeleteMany(ids: string[]): Promise<{ count: number }> {
        return this.repository.softDeleteMany<{ count: number }>(ids);
    }

    /**
     * Find multiple records with optional filtering
     * @param where - Optional filter condition (Prisma WhereInput)
     * @returns Array of matching records
     * @example
     * ```typescript
     * // Find all active users
     * const activeUsers = await userService.findMany({ status: 'active' });
     * 
     * // Find all records
     * const allUsers = await userService.findMany();
     * 
     * // Complex filtering
     * const users = await userService.findMany({
     *   AND: [
     *     { status: 'active' },
     *     { role: { in: ['admin', 'moderator'] } }
     *   ]
     * });
     * ```
     */
    async findMany(where?: Record<string, any>): Promise<Dro[]> {
        return this.repository.findMany<Dro>(where);
    }
}