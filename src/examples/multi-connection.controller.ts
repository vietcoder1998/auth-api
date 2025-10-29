/**
 * Multi-Connection Management API Controllers
 * REST API endpoints for managing multiple database and Redis connections
 */

import { Request, Response } from 'express';
import { setup } from '../setup';

/**
 * POST /api/admin/connections/multi/database
 * Create multiple database connections
 * Body: { connections: Array<{ name: string, databaseUrl: string, setAsActive?: boolean }> }
 */
export async function createMultipleDatabaseConnections(req: Request, res: Response) {
  try {
    const { connections } = req.body;
    
    if (!connections || !Array.isArray(connections) || connections.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Connections array is required'
      });
    }

    await setup.createMultipleDatabaseConnections(connections);
    const allConnections = setup.listAllConnections();
    
    res.json({
      success: true,
      message: `Successfully created ${connections.length} database connections`,
      data: {
        created: connections.map(c => c.name),
        allConnections: allConnections.databases,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create multiple database connections',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/admin/connections/multi/redis
 * Create multiple Redis connections
 * Body: { connections: Array<{ name: string, redisUrl: string, setAsActive?: boolean }> }
 */
export async function createMultipleRedisConnections(req: Request, res: Response) {
  try {
    const { connections } = req.body;
    
    if (!connections || !Array.isArray(connections) || connections.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Connections array is required'
      });
    }

    await setup.createMultipleRedisConnections(connections);
    const allConnections = setup.listAllConnections();
    
    res.json({
      success: true,
      message: `Successfully created ${connections.length} Redis connections`,
      data: {
        created: connections.map(c => c.name),
        allConnections: allConnections.redis,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create multiple Redis connections',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/admin/connections/multi/list
 * List all active multi-connections
 */
export async function listAllMultiConnections(req: Request, res: Response) {
  try {
    const connections = setup.listAllConnections();
    
    res.json({
      success: true,
      data: {
        connections,
        summary: {
          totalDatabases: connections.databases.length,
          activeDatabases: connections.databases.filter(db => db.isActive).length,
          totalRedis: connections.redis.length,
          activeRedis: connections.redis.filter(r => r.isActive).length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to list connections',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/admin/connections/multi/switch/database
 * Switch active database connection
 * Body: { connectionName: string }
 */
export async function switchActiveDatabaseConnection(req: Request, res: Response) {
  try {
    const { connectionName } = req.body;
    
    if (!connectionName) {
      return res.status(400).json({
        success: false,
        error: 'Connection name is required'
      });
    }

    setup.switchActiveDatabaseConnection(connectionName);
    const connections = setup.listAllConnections();
    
    res.json({
      success: true,
      message: `Successfully switched active database connection to: ${connectionName}`,
      data: {
        activeDatabase: connectionName,
        allDatabases: connections.databases,
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
 * POST /api/admin/connections/multi/switch/redis
 * Switch active Redis connection
 * Body: { connectionName: string }
 */
export async function switchActiveRedisConnection(req: Request, res: Response) {
  try {
    const { connectionName } = req.body;
    
    if (!connectionName) {
      return res.status(400).json({
        success: false,
        error: 'Connection name is required'
      });
    }

    setup.switchActiveRedisConnection(connectionName);
    const connections = setup.listAllConnections();
    
    res.json({
      success: true,
      message: `Successfully switched active Redis connection to: ${connectionName}`,
      data: {
        activeRedis: connectionName,
        allRedis: connections.redis,
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
 * GET /api/admin/connections/multi/health
 * Test health of all connections
 */
export async function testAllMultiConnections(req: Request, res: Response) {
  try {
    const healthResults = await setup.testAllConnections();
    
    const overallHealth = {
      isHealthy: healthResults.summary.healthyDatabases === healthResults.summary.totalDatabases &&
                 healthResults.summary.healthyRedis === healthResults.summary.totalRedis,
      databaseHealth: healthResults.summary.healthyDatabases / healthResults.summary.totalDatabases,
      redisHealth: healthResults.summary.healthyRedis / healthResults.summary.totalRedis
    };
    
    res.json({
      success: true,
      message: 'Health check completed for all connections',
      data: {
        health: healthResults,
        overall: overallHealth,
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
 * POST /api/admin/connections/multi/test/specific
 * Test specific connections
 * Body: { database?: string, redis?: string }
 */
export async function testSpecificMultiConnections(req: Request, res: Response) {
  try {
    const { database, redis } = req.body;
    
    if (!database && !redis) {
      return res.status(400).json({
        success: false,
        error: 'At least one connection name (database or redis) is required'
      });
    }

    const results = await setup.testSpecificConnections({ database, redis });
    
    res.json({
      success: true,
      message: 'Specific connection test completed',
      data: {
        results,
        tested: { database, redis },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to test specific connections',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * DELETE /api/admin/connections/multi/remove
 * Remove specific connection
 * Body: { type: 'database' | 'redis', connectionName: string }
 */
export async function removeMultiConnection(req: Request, res: Response) {
  try {
    const { type, connectionName } = req.body;
    
    if (!type || !connectionName) {
      return res.status(400).json({
        success: false,
        error: 'Type and connection name are required'
      });
    }
    
    if (!['database', 'redis'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type must be either database or redis'
      });
    }

    await setup.removeConnection(type, connectionName);
    const connections = setup.listAllConnections();
    
    res.json({
      success: true,
      message: `Successfully removed ${type} connection: ${connectionName}`,
      data: {
        removed: { type, name: connectionName },
        remainingConnections: connections,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to remove connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/admin/connections/multi/tenant/setup
 * Setup multi-tenant database connections
 * Body: { tenants: string[] }
 */
export async function setupMultiTenant(req: Request, res: Response) {
  try {
    const { tenants } = req.body;
    
    if (!tenants || !Array.isArray(tenants) || tenants.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tenants array is required'
      });
    }

    const connections = tenants.map(tenant => ({
      name: `tenant_${tenant}`,
      databaseUrl: `mysql://user:password@localhost:3306/tenant_${tenant}_db`
    }));
    
    await setup.createMultipleDatabaseConnections(connections);
    
    res.json({
      success: true,
      message: `Successfully setup multi-tenant databases for ${tenants.length} tenants`,
      data: {
        tenants,
        connections: connections.map(c => c.name),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to setup multi-tenant connections',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * DELETE /api/admin/connections/multi/disconnect/all
 * Disconnect all multi-connections
 */
export async function disconnectAllMultiConnections(req: Request, res: Response) {
  try {
    const connectionsBefore = setup.listAllConnections();
    
    await setup.disconnectAllConnections();
    
    res.json({
      success: true,
      message: 'Successfully disconnected all connections',
      data: {
        disconnected: {
          databases: connectionsBefore.databases.length,
          redis: connectionsBefore.redis.length
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect all connections',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Example Express router setup:
 * 
 * import express from 'express';
 * import * as multiConnectionController from './multi-connection.controller';
 * 
 * const router = express.Router();
 * 
 * // Multi-connection creation
 * router.post('/connections/multi/database', multiConnectionController.createMultipleDatabaseConnections);
 * router.post('/connections/multi/redis', multiConnectionController.createMultipleRedisConnections);
 * 
 * // Connection management
 * router.get('/connections/multi/list', multiConnectionController.listAllMultiConnections);
 * router.post('/connections/multi/switch/database', multiConnectionController.switchActiveDatabaseConnection);
 * router.post('/connections/multi/switch/redis', multiConnectionController.switchActiveRedisConnection);
 * 
 * // Health monitoring
 * router.get('/connections/multi/health', multiConnectionController.testAllMultiConnections);
 * router.post('/connections/multi/test/specific', multiConnectionController.testSpecificMultiConnections);
 * 
 * // Connection removal
 * router.delete('/connections/multi/remove', multiConnectionController.removeMultiConnection);
 * router.delete('/connections/multi/disconnect/all', multiConnectionController.disconnectAllMultiConnections);
 * 
 * // Multi-tenant
 * router.post('/connections/multi/tenant/setup', multiConnectionController.setupMultiTenant);
 * 
 * export default router;
 */