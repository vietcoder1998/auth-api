

import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/auth.routes';
import configRouter from './routes/config.routes';
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
    allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
  } catch (err) {
    allowedOrigins = ['http://localhost:3000'];
  }
  cors({
    origin: allowedOrigins,
    credentials: true
  })(req, res, next);
});

// API path config
const API_PATH = process.env.API_PATH || '/auth';
app.use(API_PATH, authRouter);
app.use('/config', configRouter);
app.get('/', (req, res) => res.json({ status: 'ok' }));

// Serve admin GUI at /admin
app.use('/admin', express.static(path.join(__dirname, 'gui')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Auth API running on port ${PORT}`);
  console.log(`Admin GUI available at http://localhost:${PORT}/admin`);
});
