import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

export interface LogEntry {
  id?: string;
  level: LogLevel;
  message: string;
  metadata?: any;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  timestamp?: Date;
}

export interface LogFilter {
  level?: LogLevel;
  userId?: string;
  endpoint?: string;
  method?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export class LoggerService {
  private logFilePath: string;

  constructor() {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    this.logFilePath = path.join(logsDir, 'application.log');
  }

  /**
   * Log an entry to both database and file
   */
  async log(entry: LogEntry): Promise<void> {
    try {
      const timestamp = new Date();
      const logEntry = {
        ...entry,
        timestamp,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null
      };

      // Save to database
      await prisma.logEntry.create({
        data: {
          level: logEntry.level,
          message: logEntry.message,
          metadata: logEntry.metadata,
          userId: logEntry.userId,
          ipAddress: logEntry.ipAddress,
          userAgent: logEntry.userAgent,
          endpoint: logEntry.endpoint,
          method: logEntry.method,
          statusCode: logEntry.statusCode,
          responseTime: logEntry.responseTime,
          timestamp: logEntry.timestamp
        }
      });

      // Save to file as backup
      const logLine = `${timestamp.toISOString()} [${entry.level.toUpperCase()}] ${entry.message} ${entry.metadata ? JSON.stringify(entry.metadata) : ''}\n`;
      fs.appendFileSync(this.logFilePath, logLine);

    } catch (error) {
      // Fallback to console if database fails
      console.error('Failed to log entry:', error);
      console.log(`${new Date().toISOString()} [${entry.level.toUpperCase()}] ${entry.message}`);
    }
  }

  /**
   * Log error level message
   */
  async error(message: string, metadata?: any, context?: Partial<LogEntry>): Promise<void> {
    await this.log({
      level: LogLevel.ERROR,
      message,
      metadata,
      ...context
    });
  }

  /**
   * Log warning level message
   */
  async warn(message: string, metadata?: any, context?: Partial<LogEntry>): Promise<void> {
    await this.log({
      level: LogLevel.WARN,
      message,
      metadata,
      ...context
    });
  }

  /**
   * Log info level message
   */
  async info(message: string, metadata?: any, context?: Partial<LogEntry>): Promise<void> {
    await this.log({
      level: LogLevel.INFO,
      message,
      metadata,
      ...context
    });
  }

  /**
   * Log debug level message
   */
  async debug(message: string, metadata?: any, context?: Partial<LogEntry>): Promise<void> {
    await this.log({
      level: LogLevel.DEBUG,
      message,
      metadata,
      ...context
    });
  }

  /**
   * Get logs with filtering and pagination
   */
  async getLogs(filter: LogFilter = {}): Promise<{
    logs: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        level,
        userId,
        endpoint,
        method,
        startDate,
        endDate,
        search,
        page = 1,
        limit = 50
      } = filter;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (level) where.level = level;
      if (userId) where.userId = userId;
      if (endpoint) where.endpoint = { contains: endpoint };
      if (method) where.method = method;
      
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = startDate;
        if (endDate) where.timestamp.lte = endDate;
      }

      if (search) {
        where.OR = [
          { message: { contains: search } },
          { endpoint: { contains: search } },
          { metadata: { contains: search } }
        ];
      }

      // Get total count
      const total = await prisma.logEntry.count({ where });

      // Get logs
      const logs = await prisma.logEntry.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nickname: true
            }
          }
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit
      });

      return {
        logs: logs.map(log => ({
          ...log,
          metadata: log.metadata ? JSON.parse(log.metadata) : null
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };

    } catch (error) {
      console.error('Failed to get logs:', error);
      throw new Error('Failed to retrieve logs');
    }
  }

  /**
   * Get log statistics
   */
  async getLogStats(): Promise<{
    totalLogs: number;
    errorCount: number;
    warnCount: number;
    infoCount: number;
    debugCount: number;
    todayLogs: number;
    avgResponseTime: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalLogs,
        errorCount,
        warnCount,
        infoCount,
        debugCount,
        todayLogs,
        avgResponseTimeResult
      ] = await Promise.all([
        prisma.logEntry.count(),
        prisma.logEntry.count({ where: { level: LogLevel.ERROR } }),
        prisma.logEntry.count({ where: { level: LogLevel.WARN } }),
        prisma.logEntry.count({ where: { level: LogLevel.INFO } }),
        prisma.logEntry.count({ where: { level: LogLevel.DEBUG } }),
        prisma.logEntry.count({ where: { timestamp: { gte: today } } }),
        prisma.logEntry.aggregate({
          where: {
            responseTime: { not: null }
          },
          _avg: {
            responseTime: true
          }
        })
      ]);

      const avgResponseTime = avgResponseTimeResult._avg.responseTime || 0;

      return {
        totalLogs,
        errorCount,
        warnCount,
        infoCount,
        debugCount,
        todayLogs,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100
      };

    } catch (error) {
      console.error('Failed to get log stats:', error);
      throw new Error('Failed to retrieve log statistics');
    }
  }

  /**
   * Clear old logs (older than specified days)
   */
  async clearOldLogs(daysToKeep: number = 30): Promise<{ deletedCount: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.logEntry.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });

      return { deletedCount: result.count };

    } catch (error) {
      console.error('Failed to clear old logs:', error);
      throw new Error('Failed to clear old logs');
    }
  }

  /**
   * Export logs to file
   */
  async exportLogs(filter: LogFilter = {}): Promise<string> {
    try {
      const { logs } = await this.getLogs({ ...filter, limit: 10000 });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportFilePath = path.join(process.cwd(), 'logs', `export-${timestamp}.json`);
      
      fs.writeFileSync(exportFilePath, JSON.stringify(logs, null, 2));
      
      return exportFilePath;

    } catch (error) {
      console.error('Failed to export logs:', error);
      throw new Error('Failed to export logs');
    }
  }
}

export const loggerService = new LoggerService();