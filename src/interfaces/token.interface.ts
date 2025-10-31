import { PrismaClient, Token as PrismaToken } from '@prisma/client';

export type TokenModel = PrismaClient['token'];

export interface TokenDro extends Omit<PrismaToken, 'id' | 'createdAt'> { }
export interface TokenDto extends TokenDro {
    id: string;
    createdAt: Date;
}

export interface CreateTokenData extends Omit<TokenDro, 'id' | 'createdAt'> { userId: string; accessToken: string; refreshToken: string; expiresAt: Date }