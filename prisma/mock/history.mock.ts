/**
 * Mock data for History (Login and Logic)
 * Used for database seeding
 */

export const mockLoginHistory = [
  {
    action: 'login',
    status: 'success',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    metadata: {
      location: 'New York, US',
      device: 'Desktop',
    },
  },
  {
    action: 'login',
    status: 'success',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    metadata: {
      location: 'San Francisco, US',
      device: 'Mobile',
    },
  },
  {
    action: 'logout',
    status: 'success',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    metadata: {
      location: 'New York, US',
      device: 'Desktop',
    },
  },
  {
    action: 'login',
    status: 'failed',
    ipAddress: '10.0.0.50',
    userAgent: 'Mozilla/5.0 (Linux; Android 10)',
    metadata: {
      location: 'London, UK',
      device: 'Mobile',
      reason: 'Invalid credentials',
    },
  },
];

export const mockLogicHistory = [
  {
    action: 'create_agent',
    status: 'success',
    metadata: {
      agentName: 'Customer Support Bot',
      timestamp: new Date().toISOString(),
    },
  },
  {
    action: 'update_config',
    status: 'success',
    metadata: {
      configKey: 'theme',
      oldValue: 'light',
      newValue: 'dark',
      timestamp: new Date().toISOString(),
    },
  },
  {
    action: 'delete_conversation',
    status: 'success',
    metadata: {
      conversationId: 'conv_123',
      timestamp: new Date().toISOString(),
    },
  },
  {
    action: 'export_data',
    status: 'failed',
    metadata: {
      reason: 'Insufficient permissions',
      timestamp: new Date().toISOString(),
    },
  },
];
