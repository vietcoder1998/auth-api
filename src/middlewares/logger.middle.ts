import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import path from 'path';

const getCallerInfo = () => {
  try {
    const stackTrace = new Error().stack;
    if (stackTrace) {
      const lines = stackTrace.split('\n');
      
      // Skip the first few lines (Error constructor, this function, logger functions)
      for (let i = 1; i < lines.length && i < 15; i++) {
        const stackLine = lines[i];
        
        // Skip internal Node.js, winston, and logger files
        if (
          stackLine &&
          !stackLine.includes('winston') &&
          !stackLine.includes('logger.middle.ts') &&
          !stackLine.includes('node_modules') &&
          !stackLine.includes('node:internal') &&
          !stackLine.includes('node:events') &&
          !stackLine.includes('node:process') &&
          !stackLine.includes('internal/') &&
          !stackLine.includes('logWithLocation') &&
          !stackLine.includes('logInfo') &&
          !stackLine.includes('logError') &&
          !stackLine.includes('logWarn') &&
          !stackLine.includes('logDebug')
        ) {
          // Enhanced patterns to catch more file path formats
          const patterns = [
            // Standard format: at function (file:line:col)
            /at\s+.*?\s+\(([^)]+):(\d+):\d+\)/,
            // Direct format: at file:line:col
            /at\s+([^:]+):(\d+):\d+/,
            // Parentheses format: (file:line:col)
            /\(([^)]+):(\d+):\d+\)/,
            // Windows absolute path: C:\path\file.ts:line:col
            /at\s+.*?\s+\(([A-Za-z]:[\\\/][^)]+):(\d+):\d+\)/,
            // Unix absolute path: /path/file.ts:line:col
            /at\s+.*?\s+\((\/[^)]+):(\d+):\d+\)/,
            // Async format: async function at file:line:col
            /async\s+.*?\s+\(([^)]+):(\d+):\d+\)/,
          ];
          
          for (const pattern of patterns) {
            const match = stackLine.match(pattern);
            if (match && match[1]) {
              const filePath = match[1];
              const lineNumber = match[2];
              
              // Validate that it's a TypeScript or JavaScript file
              if (filePath.includes('.ts') || filePath.includes('.js')) {
                // Extract just the filename from full path
                const fileName = path.basename(filePath);
                
                // Additional validation - make sure it's not a system file
                if (!fileName.startsWith('node:') && 
                    !fileName.includes('winston') && 
                    fileName !== 'logger.middle.ts') {
                  return { 
                    file: fileName, 
                    line: lineNumber,
                    fullPath: filePath // Keep full path for debugging if needed
                  };
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    // Debug: log parsing errors if needed
    console.debug('Stack trace parsing error:', error);
  }
  
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

  // Auto-detect caller info if not provided
  let fileName = file;
  let lineNumber = line;
  
  // If no explicit file/line provided, auto-detect from stack trace
  if (!fileName || !lineNumber || fileName === 'app' || lineNumber === '0') {
    const caller = getCallerInfo();
    fileName = caller.file;
    lineNumber = caller.line;
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

// Enhanced helper functions with better auto-detection
export const logInfo = (msg: string, meta: any = {}) => {
  logger.info(msg, meta); // Let the formatter auto-detect file/line
};

export const logError = (msg: string | Error, meta: any = {}) => {
  if (msg instanceof Error) {
    logger.error(msg.message, { stack: msg.stack, ...meta });
  } else {
    logger.error(msg, meta);
  }
};

export const logWarn = (msg: string, meta: any = {}) => {
  logger.warn(msg, meta);
};

export const logDebug = (msg: string, meta: any = {}) => {
  logger.debug(msg, meta);
};

// Legacy functions with explicit file/line (for backward compatibility)
export const logInfoAt = (msg: string, meta: any = {}, f?: string, l?: string) =>
  logWithLocation('info', msg, meta, f, l);
export const logErrorAt = (msg: string | Error, meta: any = {}, f?: string, l?: string) =>
  logWithLocation('error', msg, meta, f, l);
export const logWarnAt = (msg: string, meta: any = {}, f?: string, l?: string) =>
  logWithLocation('warn', msg, meta, f, l);
export const logDebugAt = (msg: string, meta: any = {}, f?: string, l?: string) =>
  logWithLocation('debug', msg, meta, f, l);

export { logger };
