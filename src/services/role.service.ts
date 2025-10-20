import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateRoleData {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export class RoleService {
  /**
   * Create a new role
   */
  async createRole(data: CreateRoleData) {
    const { name, description, permissionIds } = data;

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      throw new Error('Role with this name already exists');
    }

    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions: permissionIds
          ? {
              connect: permissionIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        permissions: true,
        _count: {
          select: { users: true },
        },
      },
    });

    return role;
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true,
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return role;
  }

  /**
   * Update role
   */
  async updateRole(id: string, data: UpdateRoleData) {
    const { permissionIds, ...updateData } = data;

    const role = await prisma.role.update({
      where: { id },
      data: {
        ...updateData,
        permissions: permissionIds
          ? {
              set: permissionIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        permissions: true,
        _count: {
          select: { users: true },
        },
      },
    });

    return role;
  }

  /**
   * Delete role
   */
  async deleteRole(id: string) {
    // Check if role has users
    const usersCount = await prisma.user.count({
      where: { roleId: id },
    });

    if (usersCount > 0) {
      throw new Error('Cannot delete role that has assigned users');
    }

    return await prisma.role.delete({
      where: { id },
    });
  }

  /**
   * Get all roles with pagination
   */
  async getRoles(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [{ name: { contains: search } }, { description: { contains: search } }],
        }
      : {};

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        skip,
        take: limit,
        include: {
          permissions: true,
          _count: {
            select: { users: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.role.count({ where }),
    ]);

    return {
      data: roles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Add permission to role
   */
  async addPermissionToRole(roleId: string, permissionId: string) {
    return await prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          connect: { id: permissionId },
        },
      },
      include: {
        permissions: true,
      },
    });
  }

  /**
   * Remove permission from role
   */
  async removePermissionFromRole(roleId: string, permissionId: string) {
    return await prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          disconnect: { id: permissionId },
        },
      },
      include: {
        permissions: true,
      },
    });
  }

  /**
   * Get role users
   */
  async getRoleUsers(roleId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { roleId },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          nickname: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: { roleId } }),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const roleService = new RoleService();
