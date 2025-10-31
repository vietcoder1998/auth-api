import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../env';
import { TokenDro, TokenDto, TokenModel, JwtPayload } from '../interfaces';
import { TokenRepository, tokenRepository } from '../repositories';
import { BaseService } from './index';

export class AuthService extends BaseService<TokenModel, TokenDto, TokenDro> {
  public constructor(repo: TokenRepository = tokenRepository) {
    super(repo);
  }

  public generateToken(payload: JwtPayload, expiresIn: jwt.SignOptions['expiresIn'] = '1h') {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  }

  public getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch {
      return null;
    }
  }

  public generateAccessTokenFromRefreshToken(refreshToken: string): {
    accessToken: string;
    accessTokenExpiresAt: Date | null;
    refreshTokenExpiresAt: Date | null;
  } | null {
    try {
      const payload = this.validateToken(refreshToken);
      if (!payload) return null;
      // Generate new access token
      const accessToken = this.generateToken(payload, '1h');
      return {
        accessToken,
        accessTokenExpiresAt: this.getTokenExpiration(accessToken),
        refreshTokenExpiresAt: this.getTokenExpiration(refreshToken),
      };
    } catch {
      return null;
    }
  }

  public generateRefreshToken(
    payload: JwtPayload,
    expiresIn: jwt.SignOptions['expiresIn'] = '7d',
  ) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  }

  public validateToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (err) {
      return null;
    }
  }
}
// Exporting a singleton instance of AuthService
export const authService = new AuthService(tokenRepository);
