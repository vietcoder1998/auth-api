import { prisma } from '../setup';
import { BaseRepository } from './base.repository';
import { UserDto, UserModel } from '../interfaces';

export class UserRepository extends BaseRepository<UserModel, UserDto, UserDto> {
    constructor(userDelegate = prisma.user) {
        super(userDelegate);
    }
    // Add custom methods for User if needed
}
