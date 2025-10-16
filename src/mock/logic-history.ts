// Mock data for logic history entries
export const mockLogicHistoryEntries = [
  // User registration logic
  {
    userEmail: null, // No user yet during registration
    action: 'user_registration',
    description: 'New user registration attempt',
    metadata: {
      email: 'user@example.com',
      registrationMethod: 'email',
      ipAddress: '172.16.0.10',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      verificationSent: true
    },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
  },
  {
    userEmail: 'user@example.com',
    action: 'email_verification',
    description: 'Email verification completed successfully',
    metadata: {
      verificationToken: 'abc123def456',
      verificationTime: 300, // seconds to verify
      ipAddress: '172.16.0.10'
    },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000) // 5 minutes after registration
  },

  // Admin account creation
  {
    userEmail: 'superadmin@example.com',
    action: 'admin_creation',
    description: 'Admin account created for admin@example.com',
    metadata: {
      targetUserEmail: 'admin@example.com',
      assignedRole: 'admin',
      permissions: ['user_management', 'system_config', 'reports'],
      createdBy: 'superadmin'
    },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
  },

  // Authentication attempts
  {
    userEmail: 'user@example.com',
    action: 'login_attempt',
    description: 'Successful login via SSO',
    metadata: {
      ssoProvider: 'user_portal_sso',
      ipAddress: '172.16.0.10',
      deviceInfo: 'Chrome on Linux',
      loginDuration: 7200 // 2 hour session
    },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  },
  {
    userEmail: 'admin@example.com',
    action: 'failed_login',
    description: 'Failed login attempt - invalid credentials',
    metadata: {
      ipAddress: '192.168.1.200',
      attemptMethod: 'direct',
      failureReason: 'invalid_password',
      attemptCount: 1
    },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  },

  // Permission changes
  {
    userEmail: 'superadmin@example.com',
    action: 'permission_update',
    description: 'Updated permissions for admin@example.com',
    metadata: {
      targetUserEmail: 'admin@example.com',
      previousPermissions: ['user_management', 'system_config'],
      newPermissions: ['user_management', 'system_config', 'reports', 'sso_management'],
      changedBy: 'superadmin',
      reason: 'Expanded admin responsibilities'
    },
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000) // 36 hours ago
  },

  // System configuration changes
  {
    userEmail: 'superadmin@example.com',
    action: 'system_config',
    description: 'Updated JWT token expiration time',
    metadata: {
      configKey: 'jwt_expiration_hours',
      previousValue: '24',
      newValue: '72',
      affectedSystems: ['authentication', 'session_management']
    },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    userEmail: 'admin@example.com',
    action: 'sso_config',
    description: 'Added new SSO configuration for mobile app',
    metadata: {
      ssoKey: 'mobile_app_sso',
      provider: 'internal',
      deviceTypes: ['mobile', 'tablet'],
      expirationHours: 168 // 1 week
    },
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
  },

  // Security events
  {
    userEmail: 'user@example.com',
    action: 'password_change',
    description: 'Password changed successfully',
    metadata: {
      ipAddress: '172.16.0.10',
      changeMethod: 'user_initiated',
      passwordStrength: 'strong',
      previousPasswordAge: 45 // days
    },
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000) // 18 hours ago
  },
  {
    userEmail: 'admin@example.com',
    action: 'security_alert',
    description: 'Multiple failed login attempts detected',
    metadata: {
      ipAddress: '192.168.1.200',
      attemptCount: 5,
      timeWindow: '10 minutes',
      actionTaken: 'temporary_lockout',
      lockoutDuration: 900 // 15 minutes
    },
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
  },

  // Data operations
  {
    userEmail: 'admin@example.com',
    action: 'data_export',
    description: 'Exported user login history report',
    metadata: {
      exportType: 'login_history',
      dateRange: {
        from: '2024-01-01',
        to: '2024-01-31'
      },
      recordCount: 1247,
      fileFormat: 'csv',
      fileSize: '2.3MB'
    },
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
  },
  {
    userEmail: 'superadmin@example.com',
    action: 'database_maintenance',
    description: 'Cleaned up expired sessions and tokens',
    metadata: {
      expiredSessions: 156,
      expiredTokens: 89,
      cleanupDuration: '45 seconds',
      reclaimedSpace: '12.7MB'
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  },

  // Template management
  {
    userEmail: 'admin@example.com',
    action: 'template_update',
    description: 'Updated welcome email template',
    metadata: {
      templateType: 'mail_template',
      templateKey: 'welcome_email',
      changeType: 'content_update',
      version: '1.2',
      approvedBy: 'superadmin@example.com'
    },
    createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
  },

  // Recent user activity
  {
    userEmail: 'user@example.com',
    action: 'profile_update',
    description: 'Updated profile information',
    metadata: {
      updatedFields: ['firstName', 'lastName', 'timezone'],
      ipAddress: '172.16.0.10',
      sessionId: 'sess_abc123'
    },
    createdAt: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
  },
  {
    userEmail: 'superadmin@example.com',
    action: 'system_monitoring',
    description: 'Checked system health and performance metrics',
    metadata: {
      activeUsers: 3,
      activeSessions: 5,
      systemLoad: '12%',
      memoryUsage: '456MB',
      diskUsage: '23%'
    },
    createdAt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
  }
];