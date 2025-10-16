import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import * as env from './env';
import adminRouter from './routes/admin.routes';
import authRouter from './routes/auth.routes';
import configRouter from './routes/config.routes';
import ssoAuthRouter from './routes/ssoAuth.routes';
// Import middlewares
import { jwtTokenValidation } from './middlewares/auth.middleware';
import { ssoKeyValidation } from './middlewares/sso.middleware';
import { apiKeyValidation } from './middlewares/apiKey.middleware';
import { cacheMiddleware } from './middlewares/cache.middleware';
import { logError, logger, loggerMiddleware, logInfo } from './middlewares/logger.middle';
import { rbac } from './middlewares/rbac.middleware';
import { boundaryResponse } from './middlewares/response.middleware';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

// Dynamic CORS config: fetch allowed origins from DB
app.use(async (req, res, next) => {
  // Example: fetch from a Config table, or fallback to env
  let allowedOrigins: string[] = [];
  try {
    // If you have a Config table, fetch origins from there
    const config = await prisma.config.findMany({ where: { key: 'cors_origin' } });
    allowedOrigins = config.map((c) => c.value);
    // For demo, fallback to env or default
    allowedOrigins = env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
  } catch (err) {
    allowedOrigins = ['http://localhost:3000'];
  }
  cors({
    origin: allowedOrigins,
    credentials: true,
  })(req, res, next);
});

// Swagger API docs setup
let swaggerDocument = null;
try {
  console.log('Loading swagger document...', __dirname);
  const swaggerPath = path.join(__dirname, 'openapi.yaml');
  if (fs.existsSync(swaggerPath)) {
    const file = fs.readFileSync(swaggerPath, 'utf8');
    swaggerDocument = YAML.parse(file);
  }
} catch (err) {
  swaggerDocument = null;
}
if (swaggerDocument) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

app.use(boundaryResponse);
app.use(loggerMiddleware);

// API path config
app.use('/api/auth', authRouter);

// SSO authentication routes (no JWT required)
app.use('/api/sso', ssoAuthRouter);

// Apply authentication middleware chain (order matters)
app.use(ssoKeyValidation);
app.use(apiKeyValidation); // Check for API key authentication
app.use(jwtTokenValidation); // Fallback to JWT if no API key
app.use(rbac);

app.use('/api/config', configRouter);
app.use(
  '/api/admin',
  cacheMiddleware({
    ttl: 600, // 10 minutes cache
    skipCache: (req) => {
      // Skip caching for specific admin routes that shouldn't be cached
      const skipPaths = [
        '/api/admin/cache', // Don't cache the cache management endpoints
        '/api/admin/login-history', // Don't cache login history (real-time data)
        '/api/admin/logic-history', // Don't cache logic history (real-time data)
      ];
      
      // Skip caching for POST, PUT, DELETE, PATCH requests (only cache GET requests)
      if (req.method !== 'GET') {
        console.log(`[CACHE] Skipping cache for ${req.method} ${req.originalUrl}`);
        return true;
      }
      
      // Skip caching for specific paths
      const shouldSkip = skipPaths.some(path => req.originalUrl.startsWith(path));
      
      // Debug logging
      logger.debug(`[CACHE] Cache check for ${req.originalUrl}:`, {
        method: req.method,
        shouldSkip,
        matchedPath: skipPaths.find(path => req.originalUrl.startsWith(path)) || 'none'
      });
      
      logger.info('Cache middleware check:', {
        file: 'index.ts',
        line: '108',
        url: req.originalUrl,
        method: req.method,
        shouldSkip,
        skipPaths
      });
      
      return shouldSkip;
    },
  }),
  adminRouter,
);
app.get('/', (req, res) => res.json({ status: 'ok' }));

// Apply boundary response middleware after all routes

// Serve admin GUI at /admin
app.use('/admin', express.static(path.join(__dirname, 'gui')));

const PORT = process.env.PORT || 3000;

// Check Redis connection on startup
async function checkRedisConnection() {
  try {
    // Import the Redis client from setup
    const { client } = await import('./setup');
    await client.ping();
    logInfo('✅ Redis connection successful', { file: 'index.ts', line: '135' });
    return true;
  } catch (error) {
    logError('❌ Redis connection failed:', { file: 'index.ts', line: '138', error });
    return false;
  }
}

app.listen(PORT, async () => {
  logger.info(`Auth API running on port ${PORT}`, { file: 'index.ts', line: '144' });
  console.log(`Admin GUI available at http://localhost:${PORT}/admin`);
  if (swaggerDocument) {
    logger.info(`API docs available at http://localhost:${PORT}/docs`, { file: 'index.ts', line: '147' });
  }
  
  // Check Redis connection
  await checkRedisConnection();
});
