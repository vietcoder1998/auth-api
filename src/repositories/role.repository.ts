import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { RoleDto, RoleModel } from '../interfaces';

export class RoleRepository extends BaseRepository<RoleModel, RoleDto, RoleDto> {
    constructor(roleDelegate = prisma.role) {
        super(roleDelegate);
    }

    get roleModel(): RoleModel {
        return this.model
    }
    
    async findByName(name: string) {
        return this.roleModel.findFirst({ where: { name } });
    }

    async findWithPermissions(id: string) {
        return this.roleModel.findUnique({
            where: { id },
            include: {
                permissions: true
            }
        });
    }

    async assignPermissions(roleId: string, permissionIds: string[]) {
        return this.roleModel.update({
            where: { id: roleId },
            data: {
                permissions: {
                    connect: permissionIds.map(id => ({ id }))
                }
            }
        });
    }
}

export const roleRepository = new RoleRepository(prisma.role);