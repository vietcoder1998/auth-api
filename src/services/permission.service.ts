import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreatePermissionData {
  name: string;
  description?: string;
  category?: string;
  route?: string;
  method?: string;
}

export interface UpdatePermissionData {
  name?: string;
  description?: string;
  category?: string;
  route?: string;
  method?: string;
}

export class PermissionService {
  /**
   * Create a new permission
   */
  async createPermission(data: CreatePermissionData) {
    const { name, description, category, route, method } = data;

    // Check if permission already exists
    const existingPermission = await prisma.permission.findUnique({
      where: { name },
    });

    if (existingPermission) {
      throw new Error('Permission with this name already exists');
    }

    const permission = await prisma.permission.create({
      data: {
        name,
        description,
        category: category || 'other',
        route,
        method,
      },
      include: {
        _count: {
          select: { roles: true },
        },
      },
    });

    return permission;
  }

  /**
   * Get permission by ID
   */
  async getPermissionById(id: string) {
    const permission = await prisma.permission.findUnique({
      where: { id },
      include: {
        roles: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        _count: {
          select: { roles: true },
        },
      },
    });

    if (!permission) {
      throw new Error('Permission not found');
    }

    return permission;
  }

  /**
   * Update permission
   */
  async updatePermission(id: string, data: UpdatePermissionData) {
    const permission = await prisma.permission.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { roles: true },
        },
      },
    });

    return permission;
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

    return await prisma.permission.delete({
      where: { id },
    });
  }

  /**
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
      prisma.permission.findMany({
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
    const permissions = await prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    // Group by category
    const groupedPermissions = permissions.reduce(
      (acc, permission) => {
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

export const permissionService = new PermissionService();
