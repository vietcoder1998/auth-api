import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || '3000';
export const DATABASE_URL = process.env.DATABASE_URL || '';
export const REDIS_URL = process.env.REDIS_URL || '';
export const JWT_SECRET = process.env.JWT_SECRET || '';
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
export const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const GEMINI_API_URL = process.env.GEMINI_API_URL || '';
export const LLM_CLOUD_API_KEY = process.env.LLM_CLOUD_API_KEY || '';
export const LLM_CLOUD_API_URL = process.env.LLM_CLOUD_API_URL || '';