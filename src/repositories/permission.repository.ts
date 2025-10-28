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
