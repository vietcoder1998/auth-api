import { PrismaClient, User as PrismaUser } from '@prisma/client';

export type UserModel = PrismaClient['user'];

export interface UserDro extends Omit<PrismaUser, 'id' | 'createdAt' | 'updatedAt'> {}
export interface UserDto extends UserDro {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
