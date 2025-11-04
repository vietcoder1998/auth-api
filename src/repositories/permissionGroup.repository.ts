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

  // Updated to handle many-to-many relationship with roles
  async findByRole(roleId: string) {
    return this.permissionGroupModel.findMany({ 
      where: { 
        roles: {
          some: {
            roleId: roleId
          }
        }
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    });
  }

  async findWithPermissions(id: string) {
    return this.permissionGroupModel.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
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
        include: {
          permission: {
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              route: true,
              method: true
            }
          }
        }
      };
    }

    if (includeRole) {
      include.roles = {
        include: {
          role: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      };
    }

    include._count = {
      permissions: true,
      roles: true
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

  // Updated for many-to-many relationships with junction tables
  async addPermissionsToGroup(groupId: string, permissionIds: string[]) {
    // Create junction table entries
    await prisma.permissionGroupPermission.createMany({
      data: permissionIds.map(permissionId => ({
        permissionGroupId: groupId,
        permissionId
      })),
      skipDuplicates: true
    });

    return this.permissionGroupModel.findUnique({
      where: { id: groupId },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        roles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  async removePermissionsFromGroup(groupId: string, permissionIds: string[]) {
    // Remove junction table entries
    await prisma.permissionGroupPermission.deleteMany({
      where: {
        permissionGroupId: groupId,
        permissionId: {
          in: permissionIds
        }
      }
    });

    return this.permissionGroupModel.findUnique({
      where: { id: groupId },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        roles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  async setPermissionsForGroup(groupId: string, permissionIds: string[]) {
    // Remove all existing permissions for the group
    await prisma.permissionGroupPermission.deleteMany({
      where: { permissionGroupId: groupId }
    });

    // Add new permissions
    if (permissionIds.length > 0) {
      await prisma.permissionGroupPermission.createMany({
        data: permissionIds.map(permissionId => ({
          permissionGroupId: groupId,
          permissionId
        }))
      });
    }

    return this.permissionGroupModel.findUnique({
      where: { id: groupId },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        roles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  async getPermissionsNotInGroup(groupId: string, page: number = 1, limit: number = 10, search?: string) {
    // Get permission IDs that are already in the group via junction table
    const existingPermissions = await prisma.permissionGroupPermission.findMany({
      where: { permissionGroupId: groupId },
      select: { permissionId: true }
    });

    const excludeIds = existingPermissions.map(p => p.permissionId);
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

  // New methods for many-to-many role assignment
  async assignToRoles(groupId: string, roleIds: string[]) {
    // Create junction table entries
    await prisma.rolePermissionGroup.createMany({
      data: roleIds.map(roleId => ({
        permissionGroupId: groupId,
        roleId
      })),
      skipDuplicates: true
    });

    return this.permissionGroupModel.findUnique({
      where: { id: groupId },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        roles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  async unassignFromRoles(groupId: string, roleIds?: string[]) {
    const whereClause: any = {
      permissionGroupId: groupId
    };

    if (roleIds && roleIds.length > 0) {
      whereClause.roleId = { in: roleIds };
    }

    // Remove junction table entries
    await prisma.rolePermissionGroup.deleteMany({
      where: whereClause
    });

    return this.permissionGroupModel.findUnique({
      where: { id: groupId },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        roles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  // Legacy methods for backward compatibility (deprecated)
  async assignToRole(groupId: string, roleId: string) {
    return this.assignToRoles(groupId, [roleId]);
  }

  async unassignFromRole(groupId: string) {
    return this.unassignFromRoles(groupId);
  }
}