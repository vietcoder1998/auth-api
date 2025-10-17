import { loggerService, LogLevel } from '../services/logger.service';

// Simple test function to verify logger functionality
export async function testLogger() {
  console.log('Testing Logger Service...');
  
  try {
    // Test different log levels
    await loggerService.error('Test error message', { testData: 'error test' });
    await loggerService.warn('Test warning message', { testData: 'warning test' });
    await loggerService.info('Test info message', { testData: 'info test' });
    await loggerService.debug('Test debug message', { testData: 'debug test' });
    
    // Test HTTP request logging
    await loggerService.log({
      level: LogLevel.INFO,
      message: 'Test HTTP request',
      metadata: { endpoint: '/test', method: 'GET' },
      userId: 'test-user-123',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 Test Agent',
      endpoint: '/api/test',
      method: 'GET',
      statusCode: 200,
      responseTime: 150
    });
    
    console.log('Logger test completed successfully!');
    
    // Get and display stats
    const stats = await loggerService.getLogStats();
    console.log('Current log stats:', stats);
    
    // Get recent logs
    const recentLogs = await loggerService.getLogs({ limit: 5 });
    console.log('Recent logs:', recentLogs);
    
  } catch (error) {
    console.error('Logger test failed:', error);
  }
}

// Function is already exported above