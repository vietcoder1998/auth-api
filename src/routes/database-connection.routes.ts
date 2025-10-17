import { Router } from 'express';
import { databaseConnectionController } from '../controllers/database-connection.controller';

const router = Router();

// Get all database connections
router.get('/', databaseConnectionController.getConnections.bind(databaseConnectionController));

// Get connection statistics
router.get('/stats', databaseConnectionController.getConnectionStats.bind(databaseConnectionController));

// Get single database connection
router.get('/:id', databaseConnectionController.getConnection.bind(databaseConnectionController));

// Create new database connection
router.post('/', databaseConnectionController.createConnection.bind(databaseConnectionController));

// Update database connection
router.put('/:id', databaseConnectionController.updateConnection.bind(databaseConnectionController));

// Delete database connection
router.delete('/:id', databaseConnectionController.deleteConnection.bind(databaseConnectionController));

// Test database connection
router.post('/:id/test', databaseConnectionController.testConnection.bind(databaseConnectionController));

// Check database connection configuration
router.post('/:id/check', databaseConnectionController.checkConnection.bind(databaseConnectionController));

// Create database backup
router.post('/:id/backup', databaseConnectionController.createBackup.bind(databaseConnectionController));

export default router;