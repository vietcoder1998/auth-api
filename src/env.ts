import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || '3000';
export const DATABASE_URL = process.env.DATABASE_URL || '';
export const REDIS_URL = process.env.REDIS_URL || '';
export const JWT_SECRET = process.env.JWT_SECRET || '';
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';