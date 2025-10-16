import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import path from 'path';

const getCallerInfo = () => {
  try {
    const stackTrace = new Error().stack;
    if (stackTrace) {
      const lines = stackTrace.split('\n');
      for (let i = 3; i < lines.length && i < 10; i++) {
        const stackLine = lines[i];
        if (
          stackLine &&
          !stackLine.includes('winston') &&
          !stackLine.includes('logger.middle.ts') &&
          !stackLine.includes('node_modules') &&
          !stackLine.includes('node:internal')
        ) {
          const patterns = [
            /at\s+.*?\s+\(([^)]+):(\d+):\d+\)/,
            /at\s+([^:]+):(\d+):\d+/,
            /\(([^)]+):(\d+):\d+\)/,
          ];
          for (const pattern of patterns) {
            const match = stackLine.match(pattern);
            if (match && match[1] && (match[1].includes('.ts') || match[1].includes('.js'))) {
              return { file: path.basename(match[1]), line: match[2] };
            }
          }
        }
      }
    }
  } catch {}
  return { file: 'app', line: '0' };
};

// === Fixed customFormat ===
const customFormat = winston.format.printf((info: any) => {
  const { timestamp, level, message, stack, file, line, ...meta } = info;

  // Format thời gian chuẩn
  const date = new Date(timestamp);
  const formattedDate = date.toISOString().replace('T', ' ').replace('Z', '');

  // Nếu là lỗi -> in cả message và stack
  let content = '';
  if (stack && typeof stack === 'string' && stack !== message) {
    content = `${message}\n${stack}`;
  } else {
    content = message;
  }

  // Gán caller info
  let fileName = file;
  let lineNumber = line;
  if (!fileName || !lineNumber) {
    const caller = getCallerInfo();
    fileName = fileName || caller.file;
    lineNumber = lineNumber || caller.line;
  }

  // Meta
  const excludeKeys = ['timestamp', 'level', 'message', 'stack', 'file', 'line', 'service'];
  const metaKeys = Object.keys(meta).filter((key) => !excludeKeys.includes(key));
  const metaString =
    metaKeys.length > 0
      ? ` ${JSON.stringify(Object.fromEntries(metaKeys.map((key) => [key, meta[key]])))}`
      : '';

  return `${formattedDate} [${level.toUpperCase()}] [${fileName}] [${lineNumber}] ${content}${metaString}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }), // Cho phép Error có stack
    customFormat
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        customFormat
      ),
    })
  );
}

// === Middleware ===
export function loggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  logger.info('Request started', {
    file: 'logger.middle.ts',
    line: '70',
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    body: req.method !== 'GET' ? req.body : undefined,
  });

  const originalSend = res.send;
  res.send = function (body) {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      file: 'logger.middle.ts',
      line: '82',
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
    });

    return originalSend.call(this, body);
  };

  next();
}

// === Helper ===
export const logWithLocation = (
  level: string,
  message: string | Error,
  meta: any = {},
  fileName?: string,
  lineNumber?: string
) => {
  const callerInfo = fileName && lineNumber ? { file: fileName, line: lineNumber } : {};
  if (message instanceof Error) {
    (logger as any)[level](message.message, { stack: message.stack, ...callerInfo, ...meta });
  } else {
    (logger as any)[level](message, { ...callerInfo, ...meta });
  }
};

export const logInfo = (msg: string, meta: any = {}, f?: string, l?: string) =>
  logWithLocation('info', msg, meta, f, l);
export const logError = (msg: string | Error, meta: any = {}, f?: string, l?: string) =>
  logWithLocation('error', msg, meta, f, l);
export const logWarn = (msg: string, meta: any = {}, f?: string, l?: string) =>
  logWithLocation('warn', msg, meta, f, l);
export const logDebug = (msg: string, meta: any = {}, f?: string, l?: string) =>
  logWithLocation('debug', msg, meta, f, l);

export { logger };
