// Permission Groups Mock Data
export const mockPermissionGroups = [
  {
    name: 'User Management',
    description: 'Permissions related to user account management, roles, and authentication',
    // Will be linked to permissions with category 'user' or specific user-related permissions
  },
  {
    name: 'Content Management',
    description: 'Permissions for managing blogs, documents, files, and content creation',
    // Will be linked to blog, document, file, and content-related permissions
  },
  {
    name: 'System Administration',
    description: 'High-level system configuration, database, cache, and infrastructure management',
    // Will be linked to system, database, cache, and infrastructure permissions
  },
  {
    name: 'AI & Agent Management',
    description: 'Permissions for managing AI agents, models, platforms, conversations, and prompts',
    // Will be linked to agent, AI platform, conversation, and prompt permissions
  },
  {
    name: 'API & Integration',
    description: 'API key management, SSO configuration, and external service integrations',
    // Will be linked to API key, SSO, and integration permissions
  },
  {
    name: 'Monitoring & Analytics',
    description: 'Access to logs, history, reports, notifications, and system monitoring',
    // Will be linked to logging, history, notification, and analytics permissions
  },
  {
    name: 'Job & Task Management',
    description: 'Permissions for managing background jobs, tasks, and automated processes',
    // Will be linked to job and task management permissions
  },
  {
    name: 'Configuration Management',
    description: 'System configuration, settings, mail templates, and UI customization',
    // Will be linked to config, settings, and template permissions
  }
];

// Permission group to permission mappings based on permission categories and naming patterns
export const permissionGroupMappings = {
  'User Management': [
    // User-related permissions
    'admin_users_get',
    'admin_users_post', 
    'admin_users_put',
    'admin_users_delete',
    'admin_tokens_get',
    'admin_tokens_post',
    'admin_tokens_put', 
    'admin_tokens_delete',
    'admin_roles_get',
    'admin_roles_post',
    'admin_roles_put',
    'admin_roles_delete',
    'admin_permissions_get',
    'admin_permissions_post',
    'admin_permissions_put',
    'admin_permissions_delete',
    'admin_login_history_get',
    'manage_users',
    'view_users'
  ],
  
  'Content Management': [
    // Blog and content permissions
    'admin_blogs_get',
    'admin_blogs_post',
    'admin_blogs_put',
    'admin_blogs_delete',
    'admin_documents_get',
    'admin_documents_post',
    'admin_documents_put',
    'admin_documents_delete',
    'admin_files_get',
    'admin_files_post',
    'admin_files_put',
    'admin_files_delete',
    'admin_faqs_get',
    'admin_faqs_post',
    'admin_faqs_put',
    'admin_faqs_delete'
  ],
  
  'System Administration': [
    // System and infrastructure permissions
    'admin_cache_get',
    'admin_cache_post',
    'admin_cache_delete',
    'admin_dbconnections_get',
    'admin_dbconnections_post',
    'admin_dbconnections_put',
    'admin_dbconnections_delete',
    'admin_socket_get',
    'admin_socket_post',
    'admin_socket_put',
    'admin_socket_delete',
    'admin_system_get',
    'manage_system'
  ],
  
  'AI & Agent Management': [
    // AI and agent related permissions
    'admin_agents_get',
    'admin_agents_post',
    'admin_agents_put',
    'admin_agents_delete',
    'admin_aiplatforms_get',
    'admin_aiplatforms_post',
    'admin_aiplatforms_put',
    'admin_aiplatforms_delete',
    'admin_aikeys_get',
    'admin_aikeys_post',
    'admin_aikeys_put',
    'admin_aikeys_delete',
    'admin_conversations_get',
    'admin_conversations_get_single',
    'admin_conversations_post',
    'admin_conversations_put',
    'admin_conversations_delete',
    'admin_prompts_get',
    'admin_prompts_post',
    'admin_prompts_put',
    'admin_prompts_delete',
    'admin_memories_get',
    'admin_memories_post',
    'admin_memories_put',
    'admin_memories_delete'
  ],
  
  'API & Integration': [
    // API and integration permissions
    'admin_apikeys_get',
    'admin_apikeys_post',
    'admin_apikeys_put',
    'admin_apikeys_delete',
    'admin_sso_get',
    'admin_sso_post',
    'admin_sso_put',
    'admin_sso_delete'
  ],
  
  'Monitoring & Analytics': [
    // Monitoring and analytics permissions
    'admin_logic_history_get',
    'admin_notifications_get',
    'admin_notifications_post',
    'admin_notifications_put',
    'admin_notifications_delete',
    'admin_report_get',
    'view_reports',
    'view_analytics'
  ],
  
  'Job & Task Management': [
    // Job and task permissions
    'admin_jobs_get',
    'admin_jobs_post',
    'admin_jobs_put',
    'admin_jobs_delete'
  ],
  
  'Configuration Management': [
    // Configuration and settings permissions
    'admin_config_get',
    'admin_config_post',
    'admin_config_put',
    'admin_config_delete',
    'admin_mailtemplates_get',
    'admin_mailtemplates_post',
    'admin_mailtemplates_put',
    'admin_mailtemplates_delete',
    'admin_notificationtemplates_get',
    'admin_notificationtemplates_post',
    'admin_notificationtemplates_put',
    'admin_notificationtemplates_delete'
  ]
};