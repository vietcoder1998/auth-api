import { UserDto, UserModel, UserDro, UpdateUserData } from '../interfaces';
import { prisma } from '../setup';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository<UserModel, UserDto, UserDro> {
    constructor(userDelegate = prisma.user) {
        super(userDelegate);
    }

    get userModel(): UserModel {
        return this.model as UserModel;
    }

    public async findByEmail(email: string) {
        return this.userModel.findUnique({
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

    public async findWithRole(id: string) {
        return this.userModel.findUnique({
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

    public async findByStatus(status: string) {
        return this.userModel.findMany({
            where: { status },
            include: { role: true }
        });
    }

    public async createWithRole(data: any) {
        return this.userModel.create({
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

    public async findFirst(args: any): Promise<UserDto | null> {
        const user = await this.userModel.findFirst({
            ...args,
            include: {
                role: true
            }
        }) as (UserDto & { role?: any }) | null;

        if (user) {
            const userDto: UserDto = { ...user, role: user.role || null };

            return userDto;
        }

        return null;
    }

    public async findUnique(args: any): Promise<UserDto | null> {
        const user = await this.userModel.findUnique({
            ...args,
            include: {
                role: true
            }
        }) as (UserDto & { role?: any }) | null;

        if (user) {
            const userDto: UserDto = { ...user, role: user.role || null };
            return userDto;
        }
        return null;
    }

    public override async update<Dto = UserDto, Dro = UserDro>(id: string, data: Partial<Dto>): Promise<Dro> {
        const user = await this.userModel.update({
            where: { id },
            data: {
                ...data
            },
            include: {
                role: true
            }
        });
        // Remove password from response for UserWithoutTokenDto
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword as Dro;
    }
}

export const userRepository = new UserRepository();
