import cors from 'cors';
import express from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import * as env from './env';
import { apiKeyValidation } from './middlewares/apiKey.middleware';
import { jwtTokenValidation } from './middlewares/auth.middleware';
import { cacheMiddleware } from './middlewares/cache.middleware';
import { logError, loggerMiddleware, logInfo } from './middlewares/logger.middle';
import { rbac } from './middlewares/rbac.middleware';
import { boundaryResponse } from './middlewares/response.middleware';
import { ssoKeyValidation } from './middlewares/sso.middleware';
import prisma from './prisma';
import adminRouter from './routes/admin.routes';
import authRouter from './routes/auth.routes';
import configRouter from './routes/config.routes';
import publicBlogRouter from './routes/publicBlog.routes';
import ssoAuthRouter from './routes/ssoAuth.routes';
import { client } from './setup';
import {
  getChildProcessInfo,
  getCpuStatus,
  getDatabaseStatus,
  getMemoryStatus,
  getOsStatus,
  getRedisStatus,
} from './utils/healthUtils';
import { getDisk } from './utils/validationUtils';
import { checkRedisConnection } from './utils/validationUtils';
import { configService } from './services/config.service';
import { loadSwaggerDocument } from './utils/swaggerUtils';

const app = express();
app.use(express.json());

// Dynamic CORS config: fetch allowed origins from DB
app.use(async (req, res, next) => {
  // Use configService to get allowed origins
  const allowedOrigins = await configService.getAllowedOrigins();
  cors({
    origin: allowedOrigins,
    credentials: true,
  })(req, res, next);
});

// Swagger API docs setup
const swaggerDocument = loadSwaggerDocument(__dirname);
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
      port: env.PORT,
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
// Apply boundary response middleware after all routes
app.get('/', (req, res) => res.json({ status: 'ok' }));

// Serve admin GUI at /admin
app.use('/admin', express.static(path.join(__dirname, 'gui')));

// Moved checkRedisConnection to utils/validationUtils.ts

app.listen(env.PORT, async () => {
  await checkRedisConnection(client);

  logInfo(`Auth API running on port ${env.PORT}`);
  logInfo(`Admin GUI available at http://localhost:${env.PORT}/admin`);

  if (swaggerDocument) {
    logInfo(`API docs available at http://localhost:${env.PORT}/docs`, {
      file: 'index.ts',
      line: '147',
    });
  }
});
