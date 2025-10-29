/**
 * Advanced Connection Management API Controllers
 * API endpoints for the new database service integration features
 */

import { Request, Response } from 'express';
import { setup } from '../setup';

/**
 * GET /api/admin/connections/list
 * List all available database connections from database service
 */
export async function listAvailableConnections(req: Request, res: Response) {
  try {
    const connections = await setup.listDatabaseConnections();
    
    res.json({
      success: true,
      data: {
        connections,
        total: connections.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to list available connections',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/admin/connections/active
 * Get currently active connections
 */
export async function getActiveConnections(req: Request, res: Response) {
  try {
    const activeConnections = await setup.getActiveConnections();
    
    res.json({
      success: true,
      data: activeConnections
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get active connections',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/admin/connections/switch/database
 * Switch database connection by name or ID
 * Body: { name?: string, id?: string }
 */
export async function switchDatabaseConnection(req: Request, res: Response) {
  try {
    const { name, id } = req.body;
    
    if (!name && !id) {
      return res.status(400).json({
        success: false,
        error: 'Either connection name or ID is required'
      });
    }

    await setup.switchDatabaseConnection(name, id);
    const health = await setup.testConnections();
    
    res.json({
      success: true,
      message: `Database connection switched successfully to ${name || id}`,
      data: {
        prisma: health.prisma,
        connectionName: name,
        connectionId: id,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to switch database connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/admin/connections/switch/redis
 * Switch Redis connection by name or ID
 * Body: { name?: string, id?: string }
 */
export async function switchRedisConnection(req: Request, res: Response) {
  try {
    const { name, id } = req.body;
    
    if (!name && !id) {
      return res.status(400).json({
        success: false,
        error: 'Either connection name or ID is required'
      });
    }

    await setup.switchRedisConnection(name, id);
    const health = await setup.testConnections();
    
    res.json({
      success: true,
      message: `Redis connection switched successfully to ${name || id}`,
      data: {
        redis: health.redis,
        connectionName: name,
        connectionId: id,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to switch Redis connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/admin/connections/switch/environment
 * Switch to environment-specific connections
 * Body: { environment: 'development' | 'staging' | 'production' }
 */
export async function switchEnvironment(req: Request, res: Response) {
  try {
    const { environment } = req.body;
    
    if (!environment || !['development', 'staging', 'production'].includes(environment)) {
      return res.status(400).json({
        success: false,
        error: 'Valid environment is required (development, staging, production)'
      });
    }

    await setup.switchToEnvironment(environment);
    const health = await setup.testConnections();
    const activeConnections = await setup.getActiveConnections();
    
    res.json({
      success: true,
      message: `Successfully switched to ${environment} environment`,
      data: {
        environment,
        health,
        activeConnections,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to switch to ${req.body.environment} environment`,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/admin/connections/failover
 * Switch to backup connections for failover
 */
export async function performFailover(req: Request, res: Response) {
  try {
    await setup.switchToBackupConnections();
    const health = await setup.testConnections();
    const activeConnections = await setup.getActiveConnections();
    
    const success = health.prisma && health.redis;
    
    res.json({
      success,
      message: success ? 'Failover completed successfully' : 'Partial failover completed',
      data: {
        health,
        activeConnections,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failover failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/admin/connections/auto-switch
 * Auto-switch to active connections
 */
export async function autoSwitchToActive(req: Request, res: Response) {
  try {
    // Switch to default active connections
    await setup.switchDatabaseConnection();
    await setup.switchRedisConnection();
    
    const health = await setup.testConnections();
    const activeConnections = await setup.getActiveConnections();
    
    res.json({
      success: true,
      message: 'Successfully switched to active connections',
      data: {
        health,
        activeConnections,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to auto-switch to active connections',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/admin/connections/monitor
 * Monitor connections and auto-switch if needed
 */
export async function monitorConnections(req: Request, res: Response) {
  try {
    // Test current connections
    let health = await setup.testConnections();
    const actions: string[] = [];
    
    // Auto-switch if connections are down
    if (!health.prisma) {
      try {
        await setup.switchDatabaseConnection('backup-db');
        actions.push('Switched to backup database');
      } catch {
        actions.push('Failed to switch to backup database');
      }
    }
    
    if (!health.redis) {
      try {
        await setup.switchRedisConnection('backup-redis');
        actions.push('Switched to backup Redis');
      } catch {
        actions.push('Failed to switch to backup Redis');
      }
    }
    
    // Test again after switches
    health = await setup.testConnections();
    const activeConnections = await setup.getActiveConnections();
    
    res.json({
      success: true,
      message: 'Connection monitoring completed',
      data: {
        health,
        activeConnections,
        actions,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Connection monitoring failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Example Express router setup:
 * 
 * import express from 'express';
 * import * as advancedConnectionController from './advanced-connection-management.controller';
 * 
 * const router = express.Router();
 * 
 * router.get('/connections/list', advancedConnectionController.listAvailableConnections);
 * router.get('/connections/active', advancedConnectionController.getActiveConnections);
 * router.post('/connections/switch/database', advancedConnectionController.switchDatabaseConnection);
 * router.post('/connections/switch/redis', advancedConnectionController.switchRedisConnection);
 * router.post('/connections/switch/environment', advancedConnectionController.switchEnvironment);
 * router.post('/connections/failover', advancedConnectionController.performFailover);
 * router.post('/connections/auto-switch', advancedConnectionController.autoSwitchToActive);
 * router.get('/connections/monitor', advancedConnectionController.monitorConnections);
 * 
 * export default router;
 */