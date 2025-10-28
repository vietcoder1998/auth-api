import { PrismaClient } from '@prisma/client';
import { BaseService } from './base.service';
import { PermissionDro, PermissionDto, PermissionModel } from '../interfaces';
import { permissionRepository, PermissionRepository } from '../repositories';

const prisma = new PrismaClient();

export class PermissionService extends BaseService<PermissionModel, PermissionDto, PermissionDto> {
  private permissionRepository: PermissionRepository;

  constructor(permissionRepository: PermissionRepository) {
    super(permissionRepository);
    this.permissionRepository = permissionRepository;
  }

  /**
   * Create a new permission
   */
  async createPermission(data: PermissionDto): Promise<PermissionDro> {
    // Check if permission already exists
    const existingPermission = await this.permissionRepository.findByName(data.name);

    if (existingPermission) {
      throw new Error('Permission with this name already exists');
    }

    // Create permission (will automatically be assigned to superadmin role)
    return await this.permissionRepository.create(data);
  }
  /**
   * Get permission by ID
   */
  async getPermissionById(id: string) {
    const permission = await this.permissionRepository.findById(id);

    if (!permission) {
      throw new Error('Permission not found');
    }

    return permission;
  }

  /**
   * Update permission
   */
  async updatePermission(id: string, data: PermissionDto) {
    return await this.permissionRepository.update(id, data);
  }

  /**
   * Delete permission
   */
  async deletePermission(id: string) {
    // Check if permission is assigned to roles
    const rolesCount = await prisma.role.count({
      where: {
        permissions: {
          some: { id },
        },
      },
    });

    if (rolesCount > 0) {
      throw new Error('Cannot delete permission that is assigned to roles');
    }

    return await this.permissionRepository.delete(id);
  }  /**
   * Get all permissions with pagination
   */
  async getPermissions(page: number = 1, limit: number = 20, search?: string, category?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { route: { contains: search } },
      ];
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    const [permissions, total] = await Promise.all([
      this.permissionRepository.search({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { roles: true },
          },
        },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      }),
      prisma.permission.count({ where }),
    ]);

    return {
      data: permissions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get permissions by category
   */
  async getPermissionsByCategory() {
    const permissions: any = await this.permissionRepository.search({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    // Group by category
    const groupedPermissions = permissions.reduce(
      (acc: any, permission: any) => {
        const category = permission.category || 'other';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(permission);
        return acc;
      },
      {} as Record<string, typeof permissions>,
    );

    return groupedPermissions;
  }

  /**
   * Get permission categories
   */
  async getCategories() {
    const result = await prisma.permission.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
      orderBy: {
        category: 'asc',
      },
    });

    return result.map((item) => ({
      category: item.category,
      count: item._count.category,
    }));
  }

  /**
   * Get permissions for role
   */
  async getPermissionsForRole(roleId: string) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: true,
      },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return role.permissions;
  }

  /**
   * Check if user has permission
   */
  async userHasPermission(userId: string, permissionName: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user || !user.role) {
      return false;
    }

    return user.role.permissions.some((permission) => permission.name === permissionName);
  }

  /**
   * Check if user has any of the permissions
   */
  async userHasAnyPermission(userId: string, permissionNames: string[]): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user || !user.role) {
      return false;
    }

    return user.role.permissions.some((permission) => permissionNames.includes(permission.name));
  }
}

export const permissionService = new PermissionService(permissionRepository);
