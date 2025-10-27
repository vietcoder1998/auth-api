import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { UserDto, UserModel } from '../interfaces';

export class UserRepository extends BaseRepository<UserModel, UserDto, UserDto> {
    constructor(userDelegate = prisma.user) {
        super(userDelegate);
    }

    async findByEmail(email: string) {
        return this.model.findUnique({ 
            where: { email },
            include: {
                role: {
                    include: {
                        permissions: true
                    }
                }
            }
        });
    }

    async findWithRole(id: string) {
        return this.model.findUnique({
            where: { id },
            include: {
                role: {
                    include: {
                        permissions: true
                    }
                }
            }
        });
    }

    async findByStatus(status: string) {
        return this.model.findMany({ 
            where: { status },
            include: { role: true }
        });
    }

    async createWithRole(data: any) {
        return this.model.create({
            data,
            include: {
                role: {
                    include: {
                        permissions: true
                    }
                }
            }
        });
    }

    async updateWithRole(id: string, data: any) {
        return this.model.update({
            where: { id },
            data,
            include: {
                role: {
                    include: {
                        permissions: true
                    }
                }
            }
        });
    }
}

