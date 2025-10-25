import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { RoleDto, RoleModel } from '../interfaces';

export class RoleRepository extends BaseRepository<RoleModel, RoleDto, RoleDto> {
    constructor(roleDelegate = prisma.role) {
        super(roleDelegate);
    }

    async findByName(name: string) {
        return this.model.findFirst({ where: { name } });
    }

    async findWithPermissions(id: string) {
        return this.model.findUnique({
            where: { id },
            include: {
                permissions: true
            }
        });
    }

    async assignPermissions(roleId: string, permissionIds: string[]) {
        return this.model.update({
            where: { id: roleId },
            data: {
                permissions: {
                    connect: permissionIds.map(id => ({ id }))
                }
            }
        });
    }
}
