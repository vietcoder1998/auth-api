import { PrismaClient, SSO as PrismaSSO } from '@prisma/client';

export type SSOModel = PrismaClient['sSO'];

export interface SSODro extends Omit<PrismaSSO, 'id' | 'createdAt' | 'updatedAt'> {}
export interface SSODto extends SSODro {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
