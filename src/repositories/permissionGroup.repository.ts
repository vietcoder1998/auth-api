import { 
  PermissionGroupDro, 
  PermissionGroupDto, 
  PermissionGroupModel, 
  PermissionGroupSearchParams 
} from '../interfaces/permissionGroup.interface';
import { prisma } from '../setup';
import { BaseRepository } from './base.repository';

export class PermissionGroupRepository extends BaseRepository<
  PermissionGroupModel,
  PermissionGroupDto,
  PermissionGroupDto
> {
  constructor(permissionGroupDelegate = prisma.permissionGroup) {
    super(permissionGroupDelegate);
  }

  get permissionGroupModel() {
    return this.model as PermissionGroupModel;
  }

  async findByName(name: string) {
    return this.permissionGroupModel.findFirst({ where: { name } });
  }

  async findByRole(roleId: string) {
    return this.permissionGroupModel.findMany({ 
      where: { roleId },
      include: {
        permissions: true,
        role: true
      }
    });
  }

  async findWithPermissions(id: string) {
    return this.permissionGroupModel.findUnique({
      where: { id },
      include: {
        permissions: {
          orderBy: { name: 'asc' }
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });
  }

  async findAllWithRelations(params: PermissionGroupSearchParams = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      roleId,
      includePermissions = true,
      includeRole = true
    } = params;

    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (roleId) {
      where.roleId = roleId;
    }

    const include: any = {};
    
    if (includePermissions) {
      include.permissions = {
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          route: true,
          method: true
        }
      };
    }

    if (includeRole) {
      include.role = {
        select: {
          id: true,
          name: true,
          description: true
        }
      };
    }

    include._count = {
      permissions: true
    };

    const [groups, total] = await Promise.all([
      this.permissionGroupModel.findMany({
        where,
        include,
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      this.permissionGroupModel.count({ where })
    ]);

    return {
      data: groups,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async addPermissionsToGroup(groupId: string, permissionIds: string[]) {
    return this.permissionGroupModel.update({
      where: { id: groupId },
      data: {
        permissions: {
          connect: permissionIds.map(id => ({ id }))
        }
      },
      include: {
        permissions: true,
        role: true
      }
    });
  }

  async removePermissionsFromGroup(groupId: string, permissionIds: string[]) {
    return this.permissionGroupModel.update({
      where: { id: groupId },
      data: {
        permissions: {
          disconnect: permissionIds.map(id => ({ id }))
        }
      },
      include: {
        permissions: true,
        role: true
      }
    });
  }

  async setPermissionsForGroup(groupId: string, permissionIds: string[]) {
    return this.permissionGroupModel.update({
      where: { id: groupId },
      data: {
        permissions: {
          set: permissionIds.map(id => ({ id }))
        }
      },
      include: {
        permissions: true,
        role: true
      }
    });
  }

  async getPermissionsNotInGroup(groupId: string, page: number = 1, limit: number = 10, search?: string) {
    // Get permissions that are not in the specified group
    const group = await this.permissionGroupModel.findUnique({
      where: { id: groupId },
      include: {
        permissions: {
          select: { id: true }
        }
      }
    });

    if (!group) {
      throw new Error('Permission group not found');
    }

    const excludeIds = group.permissions.map((p: any) => p.id);
    const skip = (page - 1) * limit;

    const where: any = {
      id: {
        notIn: excludeIds
      }
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [permissions, total] = await Promise.all([
      prisma.permission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.permission.count({ where })
    ]);

    return {
      data: permissions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async assignToRole(groupId: string, roleId: string) {
    return this.permissionGroupModel.update({
      where: { id: groupId },
      data: { roleId },
      include: {
        permissions: true,
        role: true
      }
    });
  }

  async unassignFromRole(groupId: string) {
    return this.permissionGroupModel.update({
      where: { id: groupId },
      data: { roleId: null },
      include: {
        permissions: true,
        role: true
      }
    });
  }
}