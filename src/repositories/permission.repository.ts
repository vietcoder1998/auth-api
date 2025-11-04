import { PermissionDro, PermissionDto, PermissionModel } from '../interfaces';
import { prisma } from '../setup';
import { BaseRepository } from './base.repository';

export class PermissionRepository extends BaseRepository<
  PermissionModel,
  PermissionDto,
  PermissionDto
> {
  constructor(permissionDelegate = prisma.permission) {
    super(permissionDelegate);
  }

  get permissionModel() {
    return this.model as PermissionModel;
  }
  async findByName(name: string) {
    return this.permissionModel.findFirst({ where: { name } });
  }

  async findByNameAndMethod(name: string, method: string | null) {
    return this.permissionModel.findFirst({ 
      where: { 
        name,
        method: method || null
      } 
    });
  }

  async findByRouteAndMethod(route: string, method: string | null) {
    return this.permissionModel.findFirst({ 
      where: { 
        route,
        method: method || null
      } 
    });
  }

  async findByCategory(category: string) {
    return this.permissionModel.findMany({ where: { category } });
  }

  async findByMethod(method: string) {
    return this.permissionModel.findMany({ where: { method } });
  }

  // Find permissions with their permission groups
  async findWithPermissionGroups(id?: string, options?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  }) {
    const where: any = {};
    
    if (id) {
      where.id = id;
    }
    
    if (options?.search) {
      where.OR = [
        { name: { contains: options.search } },
        { description: { contains: options.search } },
      ];
    }
    
    if (options?.category) {
      where.category = options.category;
    }

    const includeOptions = {
      permissionGroups: {
        include: {
          permissionGroup: {
            select: {
              id: true,
              name: true,
              description: true,
            }
          }
        }
      }
    };

    if (id) {
      return this.permissionModel.findUnique({
        where: { id },
        include: includeOptions
      });
    }

    const skip = options?.page && options?.limit ? (options.page - 1) * options.limit : undefined;
    const take = options?.limit;

    const [permissions, total] = await Promise.all([
      this.permissionModel.findMany({
        where,
        include: includeOptions,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      this.permissionModel.count({ where })
    ]);

    return { permissions, total };
  }

  // Find permissions not in a specific group
  async findPermissionsNotInGroup(groupId: string, options?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const where: any = {
      permissionGroups: {
        none: {
          permissionGroupId: groupId
        }
      }
    };

    if (options?.search) {
      where.AND = [
        where,
        {
          OR: [
            { name: { contains: options.search } },
            { description: { contains: options.search } },
          ]
        }
      ];
      delete where.permissionGroups;
      where.permissionGroups = {
        none: {
          permissionGroupId: groupId
        }
      };
    }

    const skip = options?.page && options?.limit ? (options.page - 1) * options.limit : undefined;
    const take = options?.limit;

    const [permissions, total] = await Promise.all([
      this.permissionModel.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' }
      }),
      this.permissionModel.count({ where })
    ]);

    return { permissions, total };
  }

  override async create<T = PermissionDto, R = PermissionDro>(data: T): Promise<R> {
    // Cast or transform data to the expected Prisma input type
    const createdData = await this.permissionModel.create({
      data: {
        name: (data as PermissionDto).name,
        description: (data as PermissionDto).description,
        category: (data as PermissionDto).category,
        route: (data as PermissionDto).route,
        method: (data as PermissionDto).method,
      },
     });

    // Automatically add new permission to superadmin role
    try {
      const superadminRole = await prisma.role.findUnique({
        where: { name: 'superadmin' },
        include: { permissions: true },
      });

      if (superadminRole) {
        // Check if permission is already connected to superadmin
        const hasPermission = superadminRole.permissions.some((p: any) => p.id === createdData.id);

        if (!hasPermission) {
          await prisma.role.update({
            where: { id: superadminRole.id },
            data: {
              permissions: {
                connect: { id: createdData.id },
              },
            },
          });
          console.log(
            `Permission '${(createdData as any).name}' automatically added to superadmin role`,
          );
        }
      } else {
        console.warn('Superadmin role not found - permission created but not assigned');
      }
    } catch (error) {
      console.error('Error adding permission to superadmin role:', error);
      // Don't fail the entire operation if role assignment fails
    }

    return createdData as R;
  }
}

export const permissionRepository = new PermissionRepository(prisma.permission);
