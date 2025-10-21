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
import publicBlogRouter from './routes/publicBlog.routes';
import ssoAuthRouter from './routes/ssoAuth.routes';
import { apiKeyValidation } from './middlewares/apiKey.middleware';
import { jwtTokenValidation } from './middlewares/auth.middleware';
import { cacheMiddleware } from './middlewares/cache.middleware';
import { logError, loggerMiddleware, logInfo } from './middlewares/logger.middle';
import { rbac } from './middlewares/rbac.middleware';
import { boundaryResponse } from './middlewares/response.middleware';
import { ssoKeyValidation } from './middlewares/sso.middleware';
import { exec } from 'child_process';
import os from 'os';

const { client } = require('./setup');

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
    allowedOrigins = env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'];
  } catch (err) {
    allowedOrigins = ['http://localhost:5173'];
  }
  cors({
    origin: allowedOrigins,
    credentials: true,
  })(req, res, next);
});

// Swagger API docs setup
let swaggerDocument = null;
try {
  logInfo('Loading swagger document...', { dir: __dirname });
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

// Public blog/category API (no auth)
app.use('/api/public', publicBlogRouter);
app.use('/api/auth', authRouter);
app.get('/api/config/health', async (req, res) => {
  const {
    getDatabaseStatus,
    getRedisStatus,
    getMemoryStatus,
    getCpuStatus,
    getOsStatus,
    getChildProcessInfo,
  } = require('./utils/healthUtils');
  const { getDisk } = require('./utils/validationUtils');

  try {
    const [databaseStatus, redisStatus] = await Promise.all([
      getDatabaseStatus(prisma),
      getRedisStatus(client),
    ]);
    const memory = getMemoryStatus();
    const { cpu, cpuLoad } = getCpuStatus();
    let jobs: any[] = [];
    try {
      jobs = await prisma.job.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    } catch (jobError) {
      logError('Job fetch failed:', { error: jobError });
      jobs = [];
    }
    const osStatus = getOsStatus();
    const childProcessInfo = getChildProcessInfo();
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      api: true,
      database: databaseStatus,
      redis: redisStatus,
      uptime: process.uptime(),
      memory,
      cpu,
      cpuLoad,
      disk: null as string | null,
      jobs,
      port: PORT,
      os: osStatus,
      childProcess: childProcessInfo,
    };
    getDisk((disk: string | null) => {
      healthStatus.disk = disk;
      const statusCode = databaseStatus && redisStatus ? 200 : 503;
      res.status(statusCode).json(healthStatus);
    });
  } catch (error) {
    logError('Health check endpoint error:', { error });
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      api: true,
      database: false,
      redis: false,
      error: 'Health check failed',
      jobs: [],
    });
  }
});

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
        '/api/admin/logs', // Don't cache logs (real-time data)
      ];

      // Skip caching for POST, PUT, DELETE, PATCH requests (only cache GET requests)
      if (req.method !== 'GET') {
        console.log(`[CACHE] Skipping cache for ${req.method} ${req.originalUrl}`);
        return true;
      }

      // Skip caching for specific paths
      const shouldSkip = skipPaths.some((path) => req.originalUrl.startsWith(path));

      // Debug logging
      logInfo(`[CACHE] Cache check for ${req.originalUrl}:`, {
        method: req.method,
        shouldSkip,
        matchedPath: skipPaths.find((path) => req.originalUrl.startsWith(path)) || 'none',
      });

      logInfo('Cache middleware check:', {
        file: 'index.ts',
        line: '108',
        url: req.originalUrl,
        method: req.method,
        shouldSkip,
        skipPaths,
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

const PORT = env.PORT;

// Moved checkRedisConnection to utils/validationUtils.ts
const { checkRedisConnection } = require('./utils/validationUtils');

app.listen(PORT, async () => {
  await checkRedisConnection(client);

  logInfo(`Auth API running on port ${PORT}`);
  logInfo(`Admin GUI available at http://localhost:${PORT}/admin`);
  if (swaggerDocument) {
    logInfo(`API docs available at http://localhost:${PORT}/docs`, {
      file: 'index.ts',
      line: '147',
    });
  }
});
