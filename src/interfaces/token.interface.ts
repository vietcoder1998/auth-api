import { Prisma, PrismaClient } from '@prisma/client';
import { UserDro } from './user.interface';

// Token-related interfaces
export interface JwtPayload {
  userId: string;
  email?: string;
  role?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  roleId?: string;
}

export type TokenModel = PrismaClient['token'];

export interface UserTokenDao {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface TokenDto extends Partial<TokenModel> {
  refreshExpiresAt?: Date;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
}
export interface TokenDro extends TokenDto {
  id: string;
  user: UserDro;
  userId: string;
  expiresAt?: Date;
}

// Omit 'id' from Prisma.TokenCreateInput to avoid conflict with TokenDro
export type CreateTokenData = Omit<Prisma.TokenCreateInput, 'id'> & TokenDro & {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
};