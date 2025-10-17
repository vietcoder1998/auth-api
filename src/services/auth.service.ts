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

export function generateRefreshToken(payload: JwtPayload, expiresIn: jwt.SignOptions['expiresIn'] = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function validateToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (err) {
    return null;
  }
}
