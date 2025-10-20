import { Request, Response } from 'express';
import { loggerService, LogLevel } from '../services/logger.service';

// Get logs with filtering and pagination
export async function getLogs(req: Request, res: Response) {
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
      limit = 50,
    } = req.query;

    const filter = {
      level: level as LogLevel,
      userId: userId as string,
      endpoint: endpoint as string,
      method: method as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      search: search as string,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 50,
    };

    // Remove undefined values
    Object.keys(filter).forEach((key) => {
      if ((filter as any)[key] === undefined || (filter as any)[key] === '') {
        delete (filter as any)[key];
      }
    });

    const result = await loggerService.getLogs(filter);

    res.status(200).json({
      success: true,
      message: 'Logs retrieved successfully',
      data: result,
    });
  } catch (error) {
    console.error('Get logs controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve logs',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    });
  }
}

// Get log statistics
export async function getLogStats(req: Request, res: Response) {
  try {
    const stats = await loggerService.getLogStats();

    res.status(200).json({
      success: true,
      message: 'Log statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    console.error('Get log stats controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve log statistics',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    });
  }
}

// Clear old logs
export async function clearOldLogs(req: Request, res: Response) {
  try {
    const { daysToKeep = 30 } = req.body;

    const result = await loggerService.clearOldLogs(parseInt(daysToKeep));

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} old log entries`,
      data: result,
    });
  } catch (error) {
    console.error('Clear old logs controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear old logs',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    });
  }
}

// Export logs
export async function exportLogs(req: Request, res: Response) {
  try {
    const { level, userId, endpoint, method, startDate, endDate, search } = req.query;

    const filter = {
      level: level as LogLevel,
      userId: userId as string,
      endpoint: endpoint as string,
      method: method as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      search: search as string,
    };

    // Remove undefined values
    Object.keys(filter).forEach((key) => {
      if ((filter as any)[key] === undefined || (filter as any)[key] === '') {
        delete (filter as any)[key];
      }
    });

    const exportPath = await loggerService.exportLogs(filter);

    res.status(200).json({
      success: true,
      message: 'Logs exported successfully',
      data: { exportPath },
    });
  } catch (error) {
    console.error('Export logs controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export logs',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    });
  }
}

// Create a manual log entry
export async function createLogEntry(req: Request, res: Response) {
  try {
    const { level, message, metadata } = req.body;
    const userId = (req as any).user?.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    if (!level || !message) {
      return res.status(400).json({
        success: false,
        message: 'Level and message are required',
        errors: ['Missing required fields'],
      });
    }

    await loggerService.log({
      level: level as LogLevel,
      message,
      metadata,
      userId,
      ipAddress,
      userAgent,
    });

    res.status(201).json({
      success: true,
      message: 'Log entry created successfully',
    });
  } catch (error) {
    console.error('Create log entry controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create log entry',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    });
  }
}
