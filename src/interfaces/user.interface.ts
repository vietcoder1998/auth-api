import { PrismaClient } from '@prisma/client';
import { RoleDto } from './role.interface';

export type UserModel = PrismaClient['user'];

export interface UserDto extends Partial<UserModel> {
  email: string;
  password: string;
  nickname?: string | null;
  roleId?: string | null;
  status?: string | null;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  role: RoleDto | null;
}
export interface CreateUserData extends Omit<UserDto, 'id' | 'createdAt' | 'updatedAt'> {
  email: string;
  password: string;
  nickname?: string;
  roleId?: string;
}

export interface UpdateUserData
  extends Partial<Omit<UserDto, 'id' | 'createdAt' | 'updatedAt' | 'email'>> {
  email?: string;
  nickname?: string;
  roleId?: string;
  status?: string;
}

export interface UserDro extends Partial<UserDto> {}
export interface UserWithoutTokenDto extends Partial<Omit<UserDto, 'password'>> {}
