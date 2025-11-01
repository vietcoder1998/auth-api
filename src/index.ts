import { authMiddleware } from './middlewares/auth.middleware';
import cors from 'cors';
import express from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import * as env from './env';
import { ResponseMiddleware } from './middlewares';
import { apiKeyValidation } from './middlewares/apiKey.middleware';
import { CacheMiddleware } from './middlewares/cache.middleware';
import { logError, loggerMiddleware, logInfo } from './middlewares/logger.middle';
import { rbac } from './middlewares/rbac.middleware';
import { ssoKeyValidation } from './middlewares/sso.middleware';
import adminRouter from './routes/admin.routes';
import authRouter from './routes/auth.routes';
import configRouter from './routes/config.routes';
import publicBlogRouter from './routes/publicBlog.routes';
import ssoAuthRouter from './routes/ssoAuth.routes';
import { configService } from './services/config.service';
import { jobQueue } from './services/job.service';
import { setup } from './setup';
import {
  getChildProcessInfo,
  getCpuStatus,
  getDatabaseStatus,
  getMemoryStatus,
  getOsStatus,
  getRedisStatus,
} from './utils/healthUtils';
import { loadSwaggerDocument } from './utils/swaggerUtils';
import { checkRedisConnection, getDisk } from './utils/validationUtils';

const swaggerDocument = loadSwaggerDocument(__dirname);
const app = express();

app.use(express.json());
app.use(
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): Promise<void> => {
    // Use configService to get allowed origins
    const allowedOrigins = await configService.getAllowedOrigins();
    logInfo('CORS check', {
      url: req.originalUrl,
      method: req.method,
      allowedOrigins,
      origin: req.headers.origin,
    });
    cors({
      origin: allowedOrigins,
      credentials: true,
    })(req, res, next);
  },
);

// Swagger API docs setup
app.use('/docs', swaggerUi?.serve, swaggerUi?.setup(swaggerDocument));
app.use(ResponseMiddleware.boundaryResponse);
app.use(loggerMiddleware);

// Public blog/category API (no auth)
app.use('/api/public', publicBlogRouter);
app.use('/api/auth', authRouter);
app.get(
  '/api/config/health',
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const [databaseStatus, redisStatus] = await Promise.all([
        getDatabaseStatus(setup.prisma),
        getRedisStatus(setup.redis),
      ]);
      const memory = getMemoryStatus();
      const { cpu, cpuLoad } = getCpuStatus();
      const jobs = await jobQueue.getJobs();
      const osStatus = getOsStatus();
      const childProcessInfo = getChildProcessInfo();
      const healthStatus: Record<string, any> = {
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
    } catch (error: any) {
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
  },
);

// SSO authentication routes (no JWT required)
app.use('/api/sso', ssoAuthRouter);
// Apply authentication middleware chain (order matters)
app.use(ssoKeyValidation);
app.use(apiKeyValidation); // Check for API key authentication
app.use(authMiddleware.jwtTokenValidation.bind(authMiddleware)); // Fallback to JWT if no API key
app.use(rbac);
app.use('/api/config', configRouter);
const cacheMiddlewareInstance = new CacheMiddleware({
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
});

app.use('/api/admin', cacheMiddlewareInstance.getMiddleware(), adminRouter);
// Serve admin GUI at /admin
app.use('/admin', express.static(path.join(__dirname, 'gui')));
app.get('/', (req: express.Request, res: express.Response) => res.json({ status: 'ok' }));
app.listen(env.PORT, async () => {
  try {
    logInfo(`Auth API running on port ${env.PORT}`);
    logInfo(`Admin GUI available at http://localhost:${env.PORT}/admin`);

    if (swaggerDocument) {
      logInfo(`API docs available at http://localhost:${env.PORT}/docs`, {
        file: 'index.ts',
        line: '147',
      });
    }

    logInfo('🚀 Server started successfully with database connections');
  } catch (error) {
    logError('💥 Failed to start server:', { error });
    process.exit(1);
  }
});
