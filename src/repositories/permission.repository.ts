import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { PermissionDto, PermissionModel } from '../interfaces';

export class PermissionRepository extends BaseRepository<PermissionModel, PermissionDto, PermissionDto> {
    constructor(permissionDelegate = prisma.permission) {
        super(permissionDelegate);
    }

    async findByName(name: string) {
        return this.model.findFirst({ where: { name } });
    }

    async findByCategory(category: string) {
        return this.model.findMany({ where: { category } });
    }

    async findByMethod(method: string) {
        return this.model.findMany({ where: { method } });
    }
}
