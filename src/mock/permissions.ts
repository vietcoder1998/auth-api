// Mock data for permissions
export const mockPermissions = [
  { name: 'create_user', description: 'Create new users', category: 'user', route: '/api/admin/users', method: 'POST' },
  { name: 'read_user', description: 'View user information', category: 'user', route: '/api/admin/users', method: 'GET' },
  { name: 'update_user', description: 'Update user information', category: 'user', route: '/api/admin/users/:id', method: 'PUT' },
  { name: 'delete_user', description: 'Delete users', category: 'user', route: '/api/admin/users/:id', method: 'DELETE' },
  { name: 'manage_users', description: 'Full user management access', category: 'user' },
  
  { name: 'create_role', description: 'Create new roles', category: 'role', route: '/api/admin/roles', method: 'POST' },
  { name: 'read_role', description: 'View role information', category: 'role', route: '/api/admin/roles', method: 'GET' },
  { name: 'update_role', description: 'Update role information', category: 'role', route: '/api/admin/roles/:id', method: 'PUT' },
  { name: 'delete_role', description: 'Delete roles', category: 'role', route: '/api/admin/roles/:id', method: 'DELETE' },
  { name: 'manage_roles', description: 'Full role management access', category: 'role' },
  
  { name: 'create_permission', description: 'Create new permissions', category: 'permission', route: '/api/admin/permissions', method: 'POST' },
  { name: 'read_permission', description: 'View permission information', category: 'permission', route: '/api/admin/permissions', method: 'GET' },
  { name: 'update_permission', description: 'Update permission information', category: 'permission', route: '/api/admin/permissions/:id', method: 'PUT' },
  { name: 'delete_permission', description: 'Delete permissions', category: 'permission', route: '/api/admin/permissions/:id', method: 'DELETE' },
  { name: 'manage_permissions', description: 'Full permission management access', category: 'permission' },
  
  { name: 'system_admin', description: 'System administration access', category: 'system' },
  { name: 'system_config', description: 'System configuration access', category: 'system', route: '/api/config', method: 'GET' },
  { name: 'system_logs', description: 'View system logs', category: 'system', route: '/api/admin/logs', method: 'GET' },
  { name: 'manage_cache', description: 'Manage cache system', category: 'system', route: '/api/admin/cache', method: 'GET' },
  
  { name: 'view_reports', description: 'View system reports', category: 'report', route: '/api/admin/reports', method: 'GET' },
  { name: 'create_reports', description: 'Create new reports', category: 'report', route: '/api/admin/reports', method: 'POST' },
  { name: 'export_reports', description: 'Export reports', category: 'report', route: '/api/admin/reports/export', method: 'GET' },
  
  { name: 'api_access', description: 'Basic API access', category: 'api' },
  { name: 'api_admin', description: 'Admin API access', category: 'api' },
  
  { name: 'view_self', description: 'View own profile', category: 'user', route: '/api/profile', method: 'GET' },
  
  // Route-based permissions with full HTTP method support
  { name: 'admin_users_get', description: 'GET admin users endpoint', category: 'api', route: '/api/admin/users', method: 'GET' },
  { name: 'admin_users_post', description: 'POST admin users endpoint', category: 'api', route: '/api/admin/users', method: 'POST' },
  { name: 'admin_users_put', description: 'PUT admin users endpoint', category: 'api', route: '/api/admin/users/:id', method: 'PUT' },
  { name: 'admin_users_patch', description: 'PATCH admin users endpoint', category: 'api', route: '/api/admin/users/:id', method: 'PATCH' },
  { name: 'admin_users_delete', description: 'DELETE admin users endpoint', category: 'api', route: '/api/admin/users/:id', method: 'DELETE' },
  
  { name: 'admin_roles_get', description: 'GET admin roles endpoint', category: 'api', route: '/api/admin/roles', method: 'GET' },
  { name: 'admin_roles_post', description: 'POST admin roles endpoint', category: 'api', route: '/api/admin/roles', method: 'POST' },
  { name: 'admin_roles_put', description: 'PUT admin roles endpoint', category: 'api', route: '/api/admin/roles/:id', method: 'PUT' },
  { name: 'admin_roles_patch', description: 'PATCH admin roles endpoint', category: 'api', route: '/api/admin/roles/:id', method: 'PATCH' },
  { name: 'admin_roles_delete', description: 'DELETE admin roles endpoint', category: 'api', route: '/api/admin/roles/:id', method: 'DELETE' },
  { name: 'admin_roles_permissions_available', description: 'GET admin roles available permissions endpoint', category: 'api', route: '/api/admin/roles/:id/permissions/available', method: 'GET' },
  { name: 'admin_roles_permissions_add', description: 'POST admin roles add permissions endpoint', category: 'api', route: '/api/admin/roles/:id/permissions/add', method: 'POST' },
  
  // Additional admin endpoints permissions
  { name: 'admin_permissions_get', description: 'GET admin permissions endpoint', category: 'api', route: '/api/admin/permissions', method: 'GET' },
  { name: 'admin_permissions_post', description: 'POST admin permissions endpoint', category: 'api', route: '/api/admin/permissions', method: 'POST' },
  { name: 'admin_permissions_put', description: 'PUT admin permissions endpoint', category: 'api', route: '/api/admin/permissions/:id', method: 'PUT' },
  { name: 'admin_permissions_patch', description: 'PATCH admin permissions endpoint', category: 'api', route: '/api/admin/permissions/:id', method: 'PATCH' },
  { name: 'admin_permissions_delete', description: 'DELETE admin permissions endpoint', category: 'api', route: '/api/admin/permissions/:id', method: 'DELETE' },
  
  { name: 'admin_tokens_get', description: 'GET admin tokens endpoint', category: 'api', route: '/api/admin/tokens', method: 'GET' },
  { name: 'admin_tokens_post', description: 'POST admin tokens endpoint', category: 'api', route: '/api/admin/tokens', method: 'POST' },
  { name: 'admin_tokens_put', description: 'PUT admin tokens endpoint', category: 'api', route: '/api/admin/tokens/:id', method: 'PUT' },
  { name: 'admin_tokens_patch', description: 'PATCH admin tokens endpoint', category: 'api', route: '/api/admin/tokens/:id', method: 'PATCH' },
  { name: 'admin_tokens_delete', description: 'DELETE admin tokens endpoint', category: 'api', route: '/api/admin/tokens/:id', method: 'DELETE' },
  
  { name: 'admin_mail_templates_get', description: 'GET admin mail templates endpoint', category: 'api', route: '/api/admin/mail-templates', method: 'GET' },
  { name: 'admin_mail_templates_post', description: 'POST admin mail templates endpoint', category: 'api', route: '/api/admin/mail-templates', method: 'POST' },
  { name: 'admin_mail_templates_put', description: 'PUT admin mail templates endpoint', category: 'api', route: '/api/admin/mail-templates/:id', method: 'PUT' },
  { name: 'admin_mail_templates_patch', description: 'PATCH admin mail templates endpoint', category: 'api', route: '/api/admin/mail-templates/:id', method: 'PATCH' },
  { name: 'admin_mail_templates_delete', description: 'DELETE admin mail templates endpoint', category: 'api', route: '/api/admin/mail-templates/:id', method: 'DELETE' },
  
  { name: 'admin_notification_templates_get', description: 'GET admin notification templates endpoint', category: 'api', route: '/api/admin/notification-templates', method: 'GET' },
  { name: 'admin_notification_templates_post', description: 'POST admin notification templates endpoint', category: 'api', route: '/api/admin/notification-templates', method: 'POST' },
  { name: 'admin_notification_templates_put', description: 'PUT admin notification templates endpoint', category: 'api', route: '/api/admin/notification-templates/:id', method: 'PUT' },
  { name: 'admin_notification_templates_patch', description: 'PATCH admin notification templates endpoint', category: 'api', route: '/api/admin/notification-templates/:id', method: 'PATCH' },
  { name: 'admin_notification_templates_delete', description: 'DELETE admin notification templates endpoint', category: 'api', route: '/api/admin/notification-templates/:id', method: 'DELETE' },
  
  { name: 'admin_mails_get', description: 'GET admin mails endpoint', category: 'api', route: '/api/admin/mails', method: 'GET' },
  { name: 'admin_mails_post', description: 'POST admin mails endpoint', category: 'api', route: '/api/admin/mails', method: 'POST' },
  { name: 'admin_mails_put', description: 'PUT admin mails endpoint', category: 'api', route: '/api/admin/mails/:id', method: 'PUT' },
  { name: 'admin_mails_patch', description: 'PATCH admin mails endpoint', category: 'api', route: '/api/admin/mails/:id', method: 'PATCH' },
  { name: 'admin_mails_delete', description: 'DELETE admin mails endpoint', category: 'api', route: '/api/admin/mails/:id', method: 'DELETE' },
  
  { name: 'admin_cache_get', description: 'GET admin cache endpoint', category: 'api', route: '/api/admin/cache', method: 'GET' },
  { name: 'admin_cache_post', description: 'POST admin cache endpoint', category: 'api', route: '/api/admin/cache', method: 'POST' },
  { name: 'admin_cache_put', description: 'PUT admin cache endpoint', category: 'api', route: '/api/admin/cache/:key', method: 'PUT' },
  { name: 'admin_cache_delete', description: 'DELETE admin cache endpoint', category: 'api', route: '/api/admin/cache', method: 'DELETE' },
  { name: 'admin_cache_clear', description: 'DELETE admin cache clear endpoint', category: 'api', route: '/api/admin/cache/clear', method: 'DELETE' },
  { name: 'admin_cache_stats', description: 'GET admin cache statistics endpoint', category: 'api', route: '/api/admin/cache/stats', method: 'GET' },
  
  // SSO Management permissions
  { name: 'admin_sso_get', description: 'GET admin SSO endpoint', category: 'api', route: '/api/admin/sso', method: 'GET' },
  { name: 'admin_sso_post', description: 'POST admin SSO endpoint', category: 'api', route: '/api/admin/sso', method: 'POST' },
  { name: 'admin_sso_put', description: 'PUT admin SSO endpoint', category: 'api', route: '/api/admin/sso/:id', method: 'PUT' },
  { name: 'admin_sso_patch', description: 'PATCH admin SSO endpoint', category: 'api', route: '/api/admin/sso/:id', method: 'PATCH' },
  { name: 'admin_sso_delete', description: 'DELETE admin SSO endpoint', category: 'api', route: '/api/admin/sso/:id', method: 'DELETE' },
  { name: 'admin_sso_regenerate', description: 'PATCH admin SSO regenerate key endpoint', category: 'api', route: '/api/admin/sso/:id/regenerate-key', method: 'PATCH' },
  
  // Login History permissions
  { name: 'admin_login_history_get', description: 'GET admin login history endpoint', category: 'api', route: '/api/admin/login-history', method: 'GET' },
  { name: 'admin_login_history_post', description: 'POST admin login history endpoint', category: 'api', route: '/api/admin/login-history', method: 'POST' },
  { name: 'admin_login_history_put', description: 'PUT admin login history endpoint', category: 'api', route: '/api/admin/login-history/:id', method: 'PUT' },
  { name: 'admin_login_history_patch', description: 'PATCH admin login history endpoint', category: 'api', route: '/api/admin/login-history/:id', method: 'PATCH' },
  { name: 'admin_login_history_delete', description: 'DELETE admin login history endpoint', category: 'api', route: '/api/admin/login-history/:id', method: 'DELETE' },
  { name: 'admin_login_history_logout', description: 'PATCH admin login history logout endpoint', category: 'api', route: '/api/admin/login-history/:id/logout', method: 'PATCH' },
  
  // Logic History permissions
  { name: 'admin_logic_history_get', description: 'GET admin logic history endpoint', category: 'api', route: '/api/admin/logic-history', method: 'GET' },
  { name: 'admin_logic_history_post', description: 'POST admin logic history endpoint', category: 'api', route: '/api/admin/logic-history', method: 'POST' },
  { name: 'admin_logic_history_put', description: 'PUT admin logic history endpoint', category: 'api', route: '/api/admin/logic-history/:id', method: 'PUT' },
  { name: 'admin_logic_history_patch', description: 'PATCH admin logic history endpoint', category: 'api', route: '/api/admin/logic-history/:id', method: 'PATCH' },
  { name: 'admin_logic_history_delete', description: 'DELETE admin logic history endpoint', category: 'api', route: '/api/admin/logic-history/:id', method: 'DELETE' },
  { name: 'admin_logic_history_notification', description: 'PATCH admin logic history notification endpoint', category: 'api', route: '/api/admin/logic-history/:id/notification-sent', method: 'PATCH' },
  
  // High-level SSO and History management permissions
  { name: 'manage_sso', description: 'Full SSO management access', category: 'sso' },
  { name: 'view_login_history', description: 'View login history', category: 'history' },
  { name: 'manage_login_history', description: 'Full login history management', category: 'history' },
  { name: 'view_logic_history', description: 'View logic history and audit trail', category: 'history' },
  { name: 'manage_logic_history', description: 'Full logic history management', category: 'history' },
  
  // Cache management permissions
  { name: 'view_cache', description: 'View cache information and statistics', category: 'cache' },
  { name: 'manage_cache', description: 'Full cache management access including clear and modify', category: 'cache' },
  { name: 'cache_admin', description: 'Administrative cache operations and monitoring', category: 'cache' },
  
  // API Key Management permissions
  { name: 'admin_api_keys_get', description: 'GET admin API keys endpoint', category: 'api', route: '/api/admin/api-keys', method: 'GET' },
  { name: 'admin_api_keys_post', description: 'POST admin API keys endpoint', category: 'api', route: '/api/admin/api-keys', method: 'POST' },
  { name: 'admin_api_keys_put', description: 'PUT admin API keys endpoint', category: 'api', route: '/api/admin/api-keys/:id', method: 'PUT' },
  { name: 'admin_api_keys_patch', description: 'PATCH admin API keys endpoint', category: 'api', route: '/api/admin/api-keys/:id', method: 'PATCH' },
  { name: 'admin_api_keys_delete', description: 'DELETE admin API keys endpoint', category: 'api', route: '/api/admin/api-keys/:id', method: 'DELETE' },
  { name: 'admin_api_keys_regenerate', description: 'PATCH admin API keys regenerate endpoint', category: 'api', route: '/api/admin/api-keys/:id/regenerate', method: 'PATCH' },
  { name: 'admin_api_keys_stats', description: 'GET admin API keys usage statistics endpoint', category: 'api', route: '/api/admin/api-keys/stats', method: 'GET' },
  { name: 'admin_api_keys_logs', description: 'GET admin API keys usage logs endpoint', category: 'api', route: '/api/admin/api-keys/:id/logs', method: 'GET' },
  
  // High-level API key management permissions
  { name: 'manage_api_keys', description: 'Full API key management access', category: 'api' },
  { name: 'view_api_keys', description: 'View API keys and usage statistics', category: 'api' },
  
  // AI Agent Management permissions
  { name: 'admin_agents_get', description: 'GET admin agents endpoint', category: 'api', route: '/api/admin/agents', method: 'GET' },
  { name: 'admin_agents_post', description: 'POST admin agents endpoint', category: 'api', route: '/api/admin/agents', method: 'POST' },
  { name: 'admin_agents_put', description: 'PUT admin agents endpoint', category: 'api', route: '/api/admin/agents/:id', method: 'PUT' },
  { name: 'admin_agents_patch', description: 'PATCH admin agents endpoint', category: 'api', route: '/api/admin/agents/:id', method: 'PATCH' },
  { name: 'admin_agents_delete', description: 'DELETE admin agents endpoint', category: 'api', route: '/api/admin/agents/:id', method: 'DELETE' },
  { name: 'admin_agents_memories_get', description: 'GET admin agent memories endpoint', category: 'api', route: '/api/admin/agents/:id/memories', method: 'GET' },
  { name: 'admin_agents_memories_post', description: 'POST admin agent memories endpoint', category: 'api', route: '/api/admin/agents/:id/memories', method: 'POST' },
  { name: 'admin_agents_memories_put', description: 'PUT admin agent memories endpoint', category: 'api', route: '/api/admin/agents/:id/memories/:memoryId', method: 'PUT' },
  { name: 'admin_agents_memories_patch', description: 'PATCH admin agent memories endpoint', category: 'api', route: '/api/admin/agents/:id/memories/:memoryId', method: 'PATCH' },
  { name: 'admin_agents_memories_delete', description: 'DELETE admin agent memories endpoint', category: 'api', route: '/api/admin/agents/:id/memories/:memoryId', method: 'DELETE' },
  
  // Conversation Management permissions
  { name: 'admin_conversations_get', description: 'GET admin conversations endpoint', category: 'api', route: '/api/admin/conversations', method: 'GET' },
  { name: 'admin_conversations_get_by_id', description: 'GET admin conversation by ID endpoint', category: 'api', route: '/api/admin/conversations/:id', method: 'GET' },
  { name: 'admin_conversations_post', description: 'POST admin conversations endpoint', category: 'api', route: '/api/admin/conversations', method: 'POST' },
  { name: 'admin_conversations_put', description: 'PUT admin conversations endpoint', category: 'api', route: '/api/admin/conversations/:id', method: 'PUT' },
  { name: 'admin_conversations_patch', description: 'PATCH admin conversations endpoint', category: 'api', route: '/api/admin/conversations/:id', method: 'PATCH' },
  { name: 'admin_conversations_delete', description: 'DELETE admin conversations endpoint', category: 'api', route: '/api/admin/conversations/:id', method: 'DELETE' },
  { name: 'admin_conversations_messages_get', description: 'GET admin conversation messages endpoint', category: 'api', route: '/api/admin/conversations/:id/messages', method: 'GET' },
  { name: 'admin_conversations_messages_post', description: 'POST admin conversation messages endpoint', category: 'api', route: '/api/admin/conversations/:id/messages', method: 'POST' },
  { name: 'admin_conversations_messages_put', description: 'PUT admin conversation messages endpoint', category: 'api', route: '/api/admin/conversations/:id/messages/:messageId', method: 'PUT' },
  { name: 'admin_conversations_messages_patch', description: 'PATCH admin conversation messages endpoint', category: 'api', route: '/api/admin/conversations/:id/messages/:messageId', method: 'PATCH' },
  { name: 'admin_conversations_messages_delete', description: 'DELETE admin conversation messages endpoint', category: 'api', route: '/api/admin/conversations/:id/messages/:messageId', method: 'DELETE' },
  
  // High-level AI agent management permissions
  { name: 'manage_ai_agents', description: 'Full AI agent management access', category: 'ai' },
  { name: 'view_ai_agents', description: 'View AI agents and conversations', category: 'ai' },
  { name: 'chat_with_agents', description: 'Chat with AI agents and create conversations', category: 'ai' },

  // Database Seed Management permissions
  { name: 'admin_seed_stats', description: 'GET admin seed statistics endpoint', category: 'api', route: '/api/admin/seed/stats', method: 'GET' },
  { name: 'admin_seed_all', description: 'POST admin seed all data endpoint', category: 'api', route: '/api/admin/seed/all', method: 'POST' },
  { name: 'admin_seed_permissions', description: 'POST admin seed permissions endpoint', category: 'api', route: '/api/admin/seed/permissions', method: 'POST' },
  { name: 'admin_seed_roles', description: 'POST admin seed roles endpoint', category: 'api', route: '/api/admin/seed/roles', method: 'POST' },
  { name: 'admin_seed_users', description: 'POST admin seed users endpoint', category: 'api', route: '/api/admin/seed/users', method: 'POST' },
  { name: 'admin_seed_configs', description: 'POST admin seed configs endpoint', category: 'api', route: '/api/admin/seed/configs', method: 'POST' },
  { name: 'admin_seed_agents', description: 'POST admin seed agents endpoint', category: 'api', route: '/api/admin/seed/agents', method: 'POST' },
  { name: 'admin_seed_api_keys', description: 'POST admin seed API keys endpoint', category: 'api', route: '/api/admin/seed/api-keys', method: 'POST' },
  { name: 'admin_seed_clear_all', description: 'DELETE admin clear all data endpoint', category: 'api', route: '/api/admin/seed/clear-all', method: 'DELETE' },

  // High-level seed management permissions
  { name: 'manage_database_seed', description: 'Full database seeding management access', category: 'system' },
  { name: 'view_database_stats', description: 'View database statistics and counts', category: 'system' },
  { name: 'seed_data', description: 'Seed database with default data', category: 'system' },
  { name: 'clear_database', description: 'Clear all data from database (dangerous)', category: 'system' },

  // Logging Management permissions
  { name: 'admin_logs_get', description: 'GET admin logs endpoint', category: 'api', route: '/api/admin/logs', method: 'GET' },
  { name: 'admin_logs_post', description: 'POST admin logs endpoint', category: 'api', route: '/api/admin/logs', method: 'POST' },
  { name: 'admin_logs_stats', description: 'GET admin logs statistics endpoint', category: 'api', route: '/api/admin/logs/stats', method: 'GET' },
  { name: 'admin_logs_export', description: 'GET admin logs export endpoint', category: 'api', route: '/api/admin/logs/export', method: 'GET' },
  { name: 'admin_logs_clear', description: 'DELETE admin logs clear old logs endpoint', category: 'api', route: '/api/admin/logs/clear', method: 'DELETE' },

  // High-level logging permissions
  { name: 'view_logs', description: 'View application logs and audit trail', category: 'logs' },
  { name: 'manage_logs', description: 'Full log management access including clear and export', category: 'logs' },
  { name: 'create_logs', description: 'Create manual log entries', category: 'logs' },
  { name: 'export_logs', description: 'Export logs for analysis and reporting', category: 'logs' },
  { name: 'clear_old_logs', description: 'Clear old log entries to manage storage', category: 'logs' },

  // Database Connection Management permissions
  { name: 'admin_database_connections_get', description: 'GET admin database connections endpoint', category: 'api', route: '/api/admin/database-connections', method: 'GET' },
  { name: 'admin_database_connections_post', description: 'POST admin database connections endpoint', category: 'api', route: '/api/admin/database-connections', method: 'POST' },
  { name: 'admin_database_connections_put', description: 'PUT admin database connections endpoint', category: 'api', route: '/api/admin/database-connections/:id', method: 'PUT' },
  { name: 'admin_database_connections_delete', description: 'DELETE admin database connections endpoint', category: 'api', route: '/api/admin/database-connections/:id', method: 'DELETE' },
  { name: 'admin_database_connections_test', description: 'POST admin database connections test endpoint', category: 'api', route: '/api/admin/database-connections/:id/test', method: 'POST' },
  { name: 'admin_database_connections_check', description: 'POST admin database connections check endpoint', category: 'api', route: '/api/admin/database-connections/:id/check', method: 'POST' },
  { name: 'admin_database_connections_backup', description: 'POST admin database connections backup endpoint', category: 'api', route: '/api/admin/database-connections/:id/backup', method: 'POST' },
  { name: 'admin_database_connections_stats', description: 'GET admin database connections statistics endpoint', category: 'api', route: '/api/admin/database-connections/stats', method: 'GET' },

  // High-level database connection permissions
  { name: 'view_database_connections', description: 'View database connections and their status', category: 'database' },
  { name: 'manage_database_connections', description: 'Full database connection management access', category: 'database' },
  { name: 'create_database_connections', description: 'Create new database connections', category: 'database' },
  { name: 'update_database_connections', description: 'Update existing database connections', category: 'database' },
  { name: 'delete_database_connections', description: 'Delete database connections', category: 'database' },
  { name: 'test_database_connections', description: 'Test database connections for connectivity', category: 'database' },
  { name: 'backup_databases', description: 'Create backups of connected databases', category: 'database' }
];

// Mock data for roles and their permission mappings
export const mockRoles = [
  {
    name: 'superadmin',
    description: 'Super Administrator with full system access',
    permissionFilter: () => true // All permissions
  },
  {
    name: 'admin',
    description: 'Administrator with limited management access',
    permissionFilter: (p: any) => [
      'manage_users', 
      'view_reports',
      'admin_login_history_get',
      'admin_logic_history_get',
      'admin_cache_get',
      'admin_cache_post',
      'admin_cache_delete',
      'view_logs',
      'manage_logs',
      'view_database_connections',
      'manage_database_connections'
    ].includes(p.name)
  },
  {
    name: 'user',
    description: 'Regular user with basic access',
    permissionFilter: (p: any) => p.name === 'view_self'
  }
];