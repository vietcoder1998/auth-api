require('dotenv').config();

import * as rd from 'redis';
import { REDIS_URL } from './env';
import { PrismaClient } from '@prisma/client';

export const client = rd.createClient({ url: REDIS_URL });
export const prisma = new PrismaClient();

client.connect();
client.on('error', (err) => console.log('Redis Client Error', err));
