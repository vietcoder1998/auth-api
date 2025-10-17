import { Request, Response } from 'express';
import { databaseConnectionService, DatabaseConnectionData } from '../services/database-connection.service';
import { logInfo, logError } from '../middlewares/logger.middle';

export class DatabaseConnectionController {
  
  // Get all database connections
  async getConnections(req: Request, res: Response) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const connections = await databaseConnectionService.findAll(includeInactive);
      
      logInfo('Database connections retrieved', {
        count: connections.length,
        includeInactive,
        userId: req.user?.id
      });

      res.json({
        data: connections,
        total: connections.length
      });
    } catch (error) {
      logError('Failed to retrieve database connections', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id
      });

      res.status(500).json({ 
        error: 'Failed to retrieve database connections'
      });
    }
  }

  // Get single database connection
  async getConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const connection = await databaseConnectionService.findById(id);

      if (!connection) {
        return res.status(404).json({ 
          error: 'Database connection not found' 
        });
      }

      logInfo('Database connection retrieved', {
        connectionId: id,
        connectionName: connection.name,
        userId: req.user?.id
      });

      res.json(connection);
    } catch (error) {
      logError('Failed to retrieve database connection', {
        connectionId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id
      });

      res.status(500).json({ 
        error: 'Failed to retrieve database connection'
      });
    }
  }

  // Create new database connection
  async createConnection(req: Request, res: Response) {
    try {
      const connectionData: DatabaseConnectionData = {
        ...req.body,
        createdBy: req.user?.id
      };

      const connection = await databaseConnectionService.create(connectionData);

      logInfo('Database connection created', {
        connectionId: connection.id,
        connectionName: connection.name,
        type: connection.type,
        userId: req.user?.id
      });

      res.status(201).json({
        ...connection,
        password: '***encrypted***'
      });
    } catch (error) {
      logError('Failed to create database connection', {
        connectionName: req.body.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id
      });

      res.status(500).json({ 
        error: 'Failed to create database connection'
      });
    }
  }

  // Update database connection
  async updateConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const connection = await databaseConnectionService.update(id, updateData);

      logInfo('Database connection updated', {
        connectionId: id,
        connectionName: connection.name,
        userId: req.user?.id
      });

      res.json({
        ...connection,
        password: '***encrypted***'
      });
    } catch (error) {
      logError('Failed to update database connection', {
        connectionId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id
      });

      res.status(500).json({ 
        error: 'Failed to update database connection'
      });
    }
  }

  // Delete database connection
  async deleteConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await databaseConnectionService.delete(id);

      if (!success) {
        return res.status(404).json({ 
          error: 'Database connection not found' 
        });
      }

      logInfo('Database connection deleted', {
        connectionId: id,
        userId: req.user?.id
      });

      res.json({ 
        message: 'Database connection deleted successfully' 
      });
    } catch (error) {
      logError('Failed to delete database connection', {
        connectionId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id
      });

      res.status(500).json({ 
        error: 'Failed to delete database connection'
      });
    }
  }

  // Test database connection
  async testConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await databaseConnectionService.testConnection(id);

      if (result.success) {
        logInfo('Database connection test successful', {
          connectionId: id,
          responseTime: result.responseTime,
          userId: req.user?.id
        });
      } else {
        logError('Database connection test failed', {
          connectionId: id,
          error: result.error,
          userId: req.user?.id
        });
      }

      res.json(result);
    } catch (error) {
      logError('Failed to test database connection', {
        connectionId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id
      });

      res.status(500).json({ 
        error: 'Failed to test database connection'
      });
    }
  }

  // Check database connection configuration
  async checkConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await databaseConnectionService.checkConnection(id);

      logInfo('Database connection configuration checked', {
        connectionId: id,
        isValid: result.success,
        userId: req.user?.id
      });

      res.json(result);
    } catch (error) {
      logError('Failed to check database connection', {
        connectionId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id
      });

      res.status(500).json({ 
        error: 'Failed to check database connection'
      });
    }
  }

  // Create backup
  async createBackup(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await databaseConnectionService.createBackup(id);

      if (result.success) {
        logInfo('Database backup created', {
          connectionId: id,
          userId: req.user?.id
        });
      } else {
        logError('Database backup failed', {
          connectionId: id,
          error: result.error,
          userId: req.user?.id
        });
      }

      res.json(result);
    } catch (error) {
      logError('Failed to create database backup', {
        connectionId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id
      });

      res.status(500).json({ 
        error: 'Failed to create database backup'
      });
    }
  }

  // Get connection statistics
  async getConnectionStats(req: Request, res: Response) {
    try {
      const stats = await databaseConnectionService.getConnectionStats();

      logInfo('Database connection statistics retrieved', {
        totalConnections: stats.total,
        userId: req.user?.id
      });

      res.json(stats);
    } catch (error) {
      logError('Failed to retrieve connection statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id
      });

      res.status(500).json({ 
        error: 'Failed to retrieve connection statistics'
      });
    }
  }
}

export const databaseConnectionController = new DatabaseConnectionController();