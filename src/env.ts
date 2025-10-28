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

// Cache Configuration
export const CACHE_TTL = parseInt(process.env.CACHE_TTL || '300', 10); // Default 5 minutes (300 seconds)
export const CACHE_PREFIX = process.env.CACHE_PREFIX || 'cache';
export const CACHE_URL_PREFIX = process.env.CACHE_URL_PREFIX || 'cache:url';
export const CACHE_USE_URL_BASED_KEYS = process.env.CACHE_USE_URL_BASED_KEYS !== 'false'; // Default true
export const CACHE_HASH_LENGTH = parseInt(process.env.CACHE_HASH_LENGTH || '8', 10); // Hash substring length

// Cache Headers
export const CACHE_HEADER_STATUS = process.env.CACHE_HEADER_STATUS || 'X-Cache';
export const CACHE_HEADER_KEY = process.env.CACHE_HEADER_KEY || 'X-Cache-Key';
export const CACHE_STATUS_HIT = process.env.CACHE_STATUS_HIT || 'HIT';
export const CACHE_STATUS_MISS = process.env.CACHE_STATUS_MISS || 'MISS';