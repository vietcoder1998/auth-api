/**
 * Connection Management API Endpoints
 * Example routes for managing database connections dynamically
 */

import { Request, Response } from 'express';
import { setup } from '../setup';

/**
 * GET /api/admin/connections/status
 * Get current connection status
 */
export async function getConnectionStatus(req: Request, res: Response) {
  try {
    const health = await setup.testConnections();
    const status = {
      isConnected: setup.isConnected,
      prisma: health.prisma,
      redis: health.redis,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get connection status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/admin/connections/redis
 * Change Redis connection
 * Body: { url: string }
 */
export async function changeRedisConnection(req: Request, res: Response) {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Redis URL is required'
      });
    }

    await setup.changeRedisConnection(url);
    const health = await setup.testConnections();
    
    res.json({
      success: true,
      message: 'Redis connection changed successfully',
      data: {
        redis: health.redis,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to change Redis connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/admin/connections/database
 * Change Prisma database connection
 * Body: { url: string }
 */
export async function changeDatabaseConnection(req: Request, res: Response) {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Database URL is required'
      });
    }

    await setup.changePrismaConnection(url);
    const health = await setup.testConnections();
    
    res.json({
      success: true,
      message: 'Database connection changed successfully',
      data: {
        prisma: health.prisma,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to change database connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/admin/connections/reconnect
 * Reconnect to all databases
 */
export async function reconnectAll(req: Request, res: Response) {
  try {
    await setup.reconnect();
    const health = await setup.testConnections();
    
    res.json({
      success: true,
      message: 'All connections reconnected successfully',
      data: {
        prisma: health.prisma,
        redis: health.redis,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to reconnect',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/admin/connections/test
 * Test all connections
 */
export async function testConnections(req: Request, res: Response) {
  try {
    const health = await setup.testConnections();
    
    res.json({
      success: true,
      message: 'Connection test completed',
      data: {
        prisma: health.prisma,
        redis: health.redis,
        allHealthy: health.prisma && health.redis,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to test connections',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Example Express router setup:
 * 
 * import express from 'express';
 * import * as connectionController from './connection-management.controller';
 * 
 * const router = express.Router();
 * 
 * router.get('/connections/status', connectionController.getConnectionStatus);
 * router.post('/connections/redis', connectionController.changeRedisConnection);
 * router.post('/connections/database', connectionController.changeDatabaseConnection);
 * router.post('/connections/reconnect', connectionController.reconnectAll);
 * router.post('/connections/test', connectionController.testConnections);
 * 
 * export default router;
 */