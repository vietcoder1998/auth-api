import { TokenDro, TokenDto, TokenModel } from '../interfaces';
import { prisma } from '../setup';
import { BaseRepository } from './base.repository';

export class TokenRepository extends BaseRepository<TokenModel, TokenDto, TokenDro> {
  constructor() {
    super(prisma.token);
  }

  public get tokenModel(): TokenModel {
    return this.model as TokenModel;
  }

  public async findByAccessToken(accessToken: string) {
    return this.tokenModel.findFirst({ where: { accessToken } });
  }

  public async findByRefreshToken(refreshToken: string) {
    return this.tokenModel.findFirst({ where: { refreshToken } });
  }

  public async findByUserId(userId: string) {
    return this.tokenModel.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async deleteExpired() {
    const now = new Date();
    return this.tokenModel.deleteMany({
      where: {
        refreshExpiresAt: {
          lt: now,
        },
      },
    });
  }

  public findUnique(args: any): Promise<TokenDro | null> {
    return this.tokenModel.findUnique({
      ...args,
      include: { user: true },
    }) as Promise<TokenDro | null>;
  }

  // Removed updateMany override because its signature does not match the base class.
  // If you need custom logic, ensure the method signature matches the base class definition.
  public override async create<T = any, R = any>(data: T): Promise<R> {
    // Adjust data shape to match Prisma's expected input
    const { userId, ...rest } = data as any;
    return this.tokenModel.create({
      data: {
        ...rest,
        user: userId ? { connect: { id: userId } } : undefined,
      },
      include: { user: true },
    }) as unknown as Promise<R>;
  }
}

export const tokenRepository = new TokenRepository();
