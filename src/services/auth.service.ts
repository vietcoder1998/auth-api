import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../env';

export interface JwtPayload {
  userId: string;
  email?: string;
  role?: string;
}

export function generateToken(payload: JwtPayload, expiresIn: jwt.SignOptions['expiresIn'] = '1h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function getTokenExpiration(token: string): Date | null {
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

export function generateAccessTokenFromRefreshToken(refreshToken: string): {
  accessToken: string;
  accessTokenExpiresAt: Date | null;
  refreshTokenExpiresAt: Date | null;
} | null {
  try {
    const payload = validateToken(refreshToken);
    if (!payload) return null;
    // Generate new access token
    const accessToken = generateToken(payload, '1h');
    return {
      accessToken,
      accessTokenExpiresAt: getTokenExpiration(accessToken),
      refreshTokenExpiresAt: getTokenExpiration(refreshToken),
    };
  } catch {
    return null;
  }
}

export function generateRefreshToken(
  payload: JwtPayload,
  expiresIn: jwt.SignOptions['expiresIn'] = '7d',
) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function validateToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (err) {
    return null;
  }
}
