import * as rd from 'redis';
import { REDIS_URL } from './env';

export const client = rd.createClient({ url: REDIS_URL });
client.connect();
client.on('error', (err) => console.log('Redis Client Error', err));