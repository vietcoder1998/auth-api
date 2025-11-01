import { Role } from '@prisma/client';
import {
  AddPermissionsResponse,
  CreateRoleData,
  PaginatedRolesResponse,
  PaginatedUsersResponse,
  PermissionsNotInRoleResponse,
  RoleDto,
  RoleModel,
  UpdateRoleData,
  RoleWithRelations,
  PermissionDro,
  RoleDro,
  PermissionDto,
} from '../interfaces';
import { RoleRepository } from '../repositories/role.repository';
import { UserRepository } from '../repositories/user.repository';
import { prisma } from '../setup';
import { BaseService } from './base.service';

export class RoleService extends BaseService<RoleModel, RoleDto, RoleDro> {
  private roleRepository: RoleRepository;
  private userRepository: UserRepository;

  constructor() {
    const roleRepository = new RoleRepository();
    super(roleRepository);
    this.roleRepository = roleRepository;
    this.userRepository = new UserRepository();
  }

  /**
   * Create a new role
   */
  async createRole(data: CreateRoleData): Promise<any> {
    const { name, description, permissionIds } = data;

    // Check if role already exists
    const existingRole = await this.roleRepository.findByName(name);

    if (existingRole) {
      throw new Error('Role with this name already exists');
    }

    const role: any = await this.roleRepository.create({
      name,
      description,
      permissions: permissionIds
        ? {
            connect: permissionIds.map((id) => ({ id })),
          }
        : undefined,
    } as any);

    // Get full role with relations
    return this.roleRepository.findWithPermissions(role.id);
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string): Promise<any> {
    const role = await this.roleRepository.findWithPermissions(id);

    if (!role) {
      throw new Error('Role not found');
    }

    return role;
  }

  /**
   * Update role
   */
  async updateRole(id: string, data: UpdateRoleData): Promise<any> {
    const { permissionIds, ...updateData } = data;

    await this.roleRepository.update(id, {
      ...updateData,
      permissions: permissionIds
        ? {
            set: permissionIds.map((id) => ({ id })),
          }
        : undefined,
    } as any);

    return this.roleRepository.findWithPermissions(id);
  }

  /**
   * Delete role
   */
  async deleteRole(id: string): Promise<Role> {
    // Check if role has users
    const usersCount = await this.userRepository.count({
      where: { roleId: id },
    });

    if (usersCount > 0) {
      throw new Error('Cannot delete role that has assigned users');
    }

    return await this.roleRepository.delete(id);
  }

  /**
   * Get all roles with pagination
   */
  async getRoles(
    page: number = 1,
    limit: number = 20,
    search?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<PaginatedRolesResponse> {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [{ name: { contains: search } }, { description: { contains: search } }],
        }
      : {};

    // Build orderBy clause
    const orderBy: any = {};
    switch (sortBy) {
      case 'name':
        orderBy.name = sortOrder;
        break;
      case 'createdAt':
        orderBy.createdAt = sortOrder;
        break;
      default:
        orderBy.createdAt = 'desc';
        break;
    }

    const [roles, total] = (await Promise.all([
      this.roleRepository.search({
        where,
        skip,
        take: limit,
        include: {
          permissions: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          users: {
            select: {
              id: true,
              email: true,
              nickname: true,
            },
          },
          _count: {
            select: {
              permissions: true,
              users: true,
            },
          },
        },
        orderBy,
      }),
      this.roleRepository.count({ where }),
    ])) as [any[], number];

    return {
      data: roles as any,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get permissions not in role with pagination
   */
  async getPermissionsNotInRole(
    roleId: string,
    page: number = 1,
    limit: number = 50,
    search?: string,
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc',
  ): Promise<PermissionsNotInRoleResponse> {
    const skip = (page - 1) * limit;

    // First, get the role to ensure it exists
    const role: RoleDto | null = await this.roleRepository.findById(roleId, {
      include: { permissions: { select: { id: true } } },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Get IDs of permissions already in the role
    const rolePermissionIds = role?.permissions?.map((p: PermissionDro) => p?.id) || [];

    // Build where clause for search and exclusion
    const whereClause: any = {
      id: {
        notIn: rolePermissionIds,
      },
    };

    // Search across multiple fields
    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereClause.OR = [
        { name: { contains: searchTerm } },
        { description: { contains: searchTerm } },
        { category: { contains: searchTerm } },
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    switch (sortBy) {
      case 'name':
        orderBy.name = sortOrder;
        break;
      case 'category':
        orderBy.category = sortOrder;
        break;
      case 'createdAt':
        orderBy.createdAt = sortOrder;
        break;
      default:
        orderBy.name = 'asc';
        break;
    }

    // Get total count and permissions
    const [total, permissions] = (await Promise.all([
      prisma.permission.count({ where: whereClause }),
      prisma.permission.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: limit,
      }),
    ])) as [number, PermissionDro[]];

    return {
      data: permissions as PermissionDro[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      roleInfo: {
        id: role.id,
        name: role.name,
        description: role.description,
        currentPermissionsCount: Number(rolePermissionIds?.length || 0),
      },
    };
  }

  /**
   * Add multiple permissions to role
   */
  async addPermissionsToRole(
    roleId: string,
    permissionIds: string[],
  ): Promise<AddPermissionsResponse> {
    if (!permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) {
      throw new Error('Permission IDs array is required');
    }

    // Check if role exists
    const role: RoleWithRelations | null = await this.roleRepository.findById(roleId, {
      include: { permissions: true },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Get current permission IDs
    const currentPermissionIds = role?.permissions?.map((p: PermissionDro) => p?.id) || [];

    // Filter out permissions that are already in the role
    const newPermissionIds = permissionIds?.filter((pid) => !currentPermissionIds.includes(pid));

    if (newPermissionIds.length === 0) {
      throw new Error('All provided permissions are already in the role');
    }

    // Update role with new permissions (connect additional permissions)
    const updatedRole = await this.roleRepository.update(roleId, {
      permissions: {
        connect: newPermissionIds.map((pid) => ({ id: pid })),
      },
    } as any);

    // Get updated role with sorted permissions
    const roleWithPermissions: any = await this.roleRepository.findById(roleId, {
      include: {
        permissions: {
          orderBy: { name: 'asc' },
        },
      },
    });

    return {
      message: `Successfully added ${newPermissionIds.length} permission(s) to role`,
      role: roleWithPermissions,
      addedPermissionsCount: newPermissionIds.length,
      totalPermissionsCount: roleWithPermissions?.permissions?.length || 0,
    };
  }

  /**
   * Add permission to role
   */
  async addPermissionToRole(roleId: string, permissionId: string): Promise<any> {
    return await this.roleRepository.update(roleId, {
      permissions: {
        connect: { id: permissionId },
      },
      include: { permissions: true },
    });
  }

  /**
   * Remove permission from role
   */
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<any> {
    return await this.roleRepository.update(roleId, {
      permissions: {
        disconnect: { id: permissionId },
      },
      include: { permissions: true },
    });
  }

  /**
   * Get role users
   */
  async getRoleUsers(
    roleId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedUsersResponse> {
    const skip = (page - 1) * limit;

    const [users, total] = (await Promise.all([
      this.userRepository.search({
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
      this.userRepository.count({ where: { roleId } }),
    ])) as [any[], number];

    return {
      data: users as any,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const roleService = new RoleService();
