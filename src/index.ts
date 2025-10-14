

import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/auth.routes';
import configRouter from './routes/config.routes';
import adminRouter from './routes/admin.routes';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import YAML from 'yaml';
import * as env from './env'
// Import middlewares
import { loggerMiddleware } from './middlewares/logger.middle';
import { cacheMiddleware } from './middlewares/cache.middleware';
import { boundaryResponse } from './middlewares/response.middleware';
import { rbac } from './middlewares/rbac.middleware';
import { jwtTokenValidation } from './middlewares/auth.middleware';

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
    allowedOrigins = config.map(c => c.value);
    // For demo, fallback to env or default
    allowedOrigins = env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
  } catch (err) {
    allowedOrigins = ['http://localhost:3000'];
  }
  cors({
    origin: allowedOrigins,
    credentials: true
  })(req, res, next);
});

// Swagger API docs setup
let swaggerDocument=null;
try {
  console.log("Loading swagger document...", __dirname);
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


// Use middlewares
app.use(loggerMiddleware);
app.use(cacheMiddleware({
  ttl: 600, // 10 minutes cache
  skipCache: (req) => {
    // Skip caching for admin routes and auth routes
    return req.originalUrl.includes('/admin') || req.originalUrl.includes('/auth');
  }
}));

// API path config
const API_PATH = process.env.API_PATH || '/auth';
app.use('/api' + API_PATH, authRouter);
app.use('/api/config',jwtTokenValidation, rbac, boundaryResponse, configRouter);
app.use('/api/admin',jwtTokenValidation, rbac, boundaryResponse, adminRouter);
app.get('/', (req, res) => res.json({ status: 'ok' }));

// Apply boundary response middleware after all routes

// Serve admin GUI at /admin
app.use('/admin', express.static(path.join(__dirname, 'gui')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Auth API running on port ${PORT}`);
  console.log(`Admin GUI available at http://localhost:${PORT}/admin`);
  if (swaggerDocument) {
    console.log(`API docs available at http://localhost:${PORT}/docs`);
  }
});