/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Create permissions with categories and descriptions
  const permissions = [
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
    { name: 'chat_with_agents', description: 'Chat with AI agents and create conversations', category: 'ai' }
  ];
  
  const permissionRecords = await Promise.all(
    permissions.map((permission: any) => prisma.permission.upsert({
      where: { name: permission.name },
      update: {
        description: permission.description,
        category: permission.category,
        route: permission.route,
        method: permission.method
      },
      create: {
        name: permission.name,
        description: permission.description,
        category: permission.category,
        route: permission.route,
        method: permission.method
      }
    }))
  );

  // Create roles
  const superadminRole = await prisma.role.upsert({
    where: { name: 'superadmin' },
    update: {
      permissions: {
        set: permissionRecords.map(p => ({ id: p.id })) // Update to include all permissions
      }
    },
    create: {
      name: 'superadmin',
      permissions: {
        connect: permissionRecords.map(p => ({ id: p.id }))
      }
    }
  });
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {
      permissions: {
        set: permissionRecords.filter(p => [
          'manage_users', 
          'view_reports',
          'admin_login_history_get',
          'admin_logic_history_get',
          'admin_cache_get',
          'admin_cache_post',
          'admin_cache_delete'
        ].includes(p.name)).map(p => ({ id: p.id }))
      }
    },
    create: {
      name: 'admin',
      permissions: {
        connect: permissionRecords.filter(p => [
          'manage_users', 
          'view_reports',
          'admin_login_history_get',
          'admin_logic_history_get',
          'admin_cache_get',
          'admin_cache_post',
          'admin_cache_delete'
        ].includes(p.name)).map(p => ({ id: p.id }))
      }
    }
  });
  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      permissions: {
        connect: permissionRecords.filter(p => p.name === 'view_self').map(p => ({ id: p.id }))
      }
    }
  });

  // Create users
  await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      email: 'superadmin@example.com',
      password: 'superadmin123',
      nickname: 'Super Admin',
      roleId: superadminRole.id,
      status: 'active'
    }
  });
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: 'admin123',
      nickname: 'Admin',
      roleId: adminRole.id,
      status: 'active'
    }
  });
  await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: 'user123',
      nickname: 'User',
      roleId: userRole.id,
      status: 'active'
    }
  });

  // Seed configuration settings
  const configs = [
    { key: 'cors_origin', value: 'http://localhost:3000' },
    { key: 'app_name', value: 'Auth API Platform' },
    { key: 'jwt_expiry', value: '24h' },
    { key: 'max_login_attempts', value: '5' },
    { key: 'session_timeout', value: '3600' },
    { key: 'email_settings', value: JSON.stringify({
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_secure: false,
        from_email: 'noreply@example.com',
        from_name: 'Auth API Platform'
      })
    },
    { key: 'feature_flags', value: JSON.stringify({
        email_verification: true,
        two_factor_auth: false,
        social_login: true,
        password_policy: true
      })
    },
    { key: 'ui_theme', value: JSON.stringify({
        primary_color: '#007bff',
        secondary_color: '#6c757d',
        dark_mode: false,
        logo_url: '/assets/logo.png'
      })
    }
  ];

  for (const config of configs) {
    await prisma.config.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config
    });
  }

  // Seed Mail Templates
  const mailTemplates = [
    {
      name: 'welcome_email',
      subject: 'Welcome to Our Platform!',
      body: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #007bff;">Welcome to Our Platform!</h1>
        <p>Hello {{name}},</p>
        <p>Thank you for joining our platform. We're excited to have you on board!</p>
        <p>Your account has been successfully created with the email: <strong>{{email}}</strong></p>
        <p>You can now log in and start exploring our features.</p>
        <div style="margin: 30px 0;">
            <a href="{{login_url}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Login to Your Account</a>
        </div>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>The Team</p>
    </div>
</body>
</html>`,
      active: true
    },
    {
      name: 'password_reset',
      subject: 'Password Reset Request',
      body: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #dc3545;">Password Reset Request</h1>
        <p>Hello {{name}},</p>
        <p>We received a request to reset your password for your account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="margin: 30px 0;">
            <a href="{{reset_url}}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
        <p>Best regards,<br>The Team</p>
    </div>
</body>
</html>`,
      active: true
    },
    {
      name: 'account_verification',
      subject: 'Please Verify Your Email Address',
      body: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Email Verification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #28a745;">Email Verification Required</h1>
        <p>Hello {{name}},</p>
        <p>Thank you for creating an account with us. To complete your registration, please verify your email address.</p>
        <div style="margin: 30px 0;">
            <a href="{{verification_url}}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email Address</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">{{verification_url}}</p>
        <p>This verification link will expire in 24 hours.</p>
        <p>Best regards,<br>The Team</p>
    </div>
</body>
</html>`,
      active: true
    }
  ];

  for (const template of mailTemplates) {
    await prisma.mailTemplate.upsert({
      where: { name: template.name },
      update: {
        subject: template.subject,
        body: template.body,
        active: template.active
      },
      create: template
    });
  }

  // Seed Notification Templates
  const notificationTemplates = [
    {
      name: 'user_login',
      title: 'New Login Detected',
      body: 'A new login was detected on your account from {{device}} at {{timestamp}}. If this wasn\'t you, please secure your account immediately.',
      active: true
    },
    {
      name: 'profile_updated',
      title: 'Profile Updated',
      body: 'Your profile information has been successfully updated. The changes include: {{changes}}.',
      active: true
    },
    {
      name: 'password_changed',
      title: 'Password Changed',
      body: 'Your account password has been successfully changed. If you didn\'t make this change, please contact support immediately.',
      active: true
    },
    {
      name: 'role_assigned',
      title: 'New Role Assigned',
      body: 'You have been assigned the role "{{role}}" by {{admin}}. Your new permissions are now active.',
      active: true
    },
    {
      name: 'account_suspended',
      title: 'Account Suspended',
      body: 'Your account has been suspended due to {{reason}}. Please contact support for more information.',
      active: true
    },
    {
      name: 'system_maintenance',
      title: 'Scheduled Maintenance',
      body: 'System maintenance is scheduled for {{date}} from {{start_time}} to {{end_time}}. Some services may be temporarily unavailable.',
      active: true
    },
    {
      name: 'security_alert',
      title: 'Security Alert',
      body: 'Security alert: {{alert_type}} detected on your account. Please review your recent activity and update your security settings if necessary.',
      active: true
    }
  ];

  for (const template of notificationTemplates) {
    await prisma.notificationTemplate.upsert({
      where: { name: template.name },
      update: {
        title: template.title,
        body: template.body,
        active: template.active
      },
      create: template
    });
  }

  // Get users for SSO seeding
  const superadminUser = await prisma.user.findUnique({ where: { email: 'superadmin@example.com' } });
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
  const regularUser = await prisma.user.findUnique({ where: { email: 'user@example.com' } });

  // TODO: Uncomment SSO seeding after running 'npx prisma generate'


  // Seed SSO entries
  const ssoEntries = [
    {
      url: 'https://app.example.com/dashboard',
      key: 'sso_key_1234567890abcdef',
      ssoKey: 'app_dashboard_sso',
      userId: superadminUser?.id || '',
      deviceIP: '192.168.1.100',
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
    {
      url: 'https://admin.example.com/panel',
      key: 'sso_key_abcdef1234567890',
      ssoKey: 'admin_panel_sso',
      userId: adminUser?.id || '',
      deviceIP: '10.0.0.50',
      isActive: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    {
      url: 'https://portal.example.com/user',
      key: 'sso_key_fedcba0987654321',
      ssoKey: 'user_portal_sso',
      userId: regularUser?.id || '',
      deviceIP: '172.16.0.10',
      isActive: true,
      expiresAt: null, // No expiration
    },
    {
      url: 'https://old.example.com/legacy',
      key: 'sso_key_legacy123456',
      ssoKey: 'legacy_system_sso',
      userId: adminUser?.id || '',
      deviceIP: '192.168.1.200',
      isActive: false, // Inactive SSO
      expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Expired 5 days ago
    },
    {
      url: 'https://mobile.example.com/app',
      key: 'sso_key_mobile987654',
      ssoKey: 'mobile_app_sso',
      userId: regularUser?.id || '',
      deviceIP: '203.0.113.45',
      isActive: true,
      expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    }
  ];

  const createdSSOEntries = [];
  for (const sso of ssoEntries) {
    if (sso.userId) {
      const createdSSO = await prisma.sSO.upsert({
        where: { key: sso.key },
        update: {
          url: sso.url,
          userId: sso.userId,
          deviceIP: sso.deviceIP,
          isActive: sso.isActive,
          expiresAt: sso.expiresAt,
          ...(sso.ssoKey && { ssoKey: sso.ssoKey }) // Add ssoKey if present
        },
        create: sso
      });
      createdSSOEntries.push(createdSSO);
    }
  }

  // Seed Login History (simulate users logging in via SSO)
  const loginHistoryEntries = [
    // Superadmin login sessions
    {
      userId: superadminUser?.id || '',
      ssoId: createdSSOEntries[0]?.id,
      deviceIP: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      location: 'New York, US',
      status: 'active',
      loginAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      userId: superadminUser?.id || '',
      ssoId: createdSSOEntries[0]?.id,
      deviceIP: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      location: 'New York, US',
      status: 'logged_out',
      loginAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      logoutAt: new Date(Date.now() - 22 * 60 * 60 * 1000), // Logged out 22 hours ago
    },

    // Admin login sessions
    {
      userId: adminUser?.id || '',
      ssoId: createdSSOEntries[1]?.id,
      deviceIP: '10.0.0.50',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      location: 'San Francisco, US',
      status: 'active',
      loginAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    },
    {
      userId: adminUser?.id || '',
      ssoId: createdSSOEntries[3]?.id, // Using inactive SSO (legacy system)
      deviceIP: '192.168.1.200',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
      location: 'Los Angeles, US',
      status: 'expired',
      loginAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
    },

    // Regular user login sessions
    {
      userId: regularUser?.id || '',
      ssoId: createdSSOEntries[2]?.id,
      deviceIP: '172.16.0.10',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      location: 'Toronto, CA',
      status: 'active',
      loginAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    },
    {
      userId: regularUser?.id || '',
      ssoId: createdSSOEntries[4]?.id, // Mobile app login
      deviceIP: '203.0.113.45',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      location: 'Vancouver, CA',
      status: 'logged_out',
      loginAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      logoutAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // Logged out 4 hours ago
    },
    {
      userId: regularUser?.id || '',
      ssoId: createdSSOEntries[2]?.id,
      deviceIP: '172.16.0.15', // Different IP (work vs home)
      userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
      location: 'Montreal, CA',
      status: 'logged_out',
      loginAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      logoutAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hour session
    },
    // Non-SSO (direct) login entries
    {
      userId: superadminUser?.id || '',
      ssoId: null, // Direct login (no SSO)
      deviceIP: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      location: 'New York, US',
      status: 'active',
      loginAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    },
    {
      userId: adminUser?.id || '',
      ssoId: null, // Direct login (no SSO)
      deviceIP: '10.0.0.51',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      location: 'San Francisco, US',
      status: 'logged_out',
      loginAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      logoutAt: new Date(Date.now() - 10 * 60 * 60 * 1000), // Logged out 10 hours ago
    },
    {
      userId: regularUser?.id || '',
      ssoId: null, // Direct login (no SSO)
      deviceIP: '172.16.0.11',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      location: 'Toronto, CA',
      status: 'expired',
      loginAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago (expired)
    }
  ];

  for (const loginHistory of loginHistoryEntries) {
    if (loginHistory.userId) {
      // Since LoginHistory might not have unique constraints, we can use create
      // But first check if a similar entry exists to avoid duplicates
      const existingEntry = await prisma.loginHistory.findFirst({
        where: {
          userId: loginHistory.userId,
          ssoId: loginHistory.ssoId || null,
          deviceIP: loginHistory.deviceIP,
          loginAt: loginHistory.loginAt
        }
      });
      
      if (!existingEntry) {
        await prisma.loginHistory.create({
          data: loginHistory
        });
      }
    }
  }

  // Seed Logic History (audit trail for various actions)
  const userLoginNotificationTemplate = await prisma.notificationTemplate.findUnique({
    where: { name: 'user_login' }
  });

  const profileUpdatedNotificationTemplate = await prisma.notificationTemplate.findUnique({
    where: { name: 'profile_updated' }
  });

  const logicHistoryEntries = [
    // SSO login actions
    {
      userId: superadminUser?.id || '',
      action: 'sso_login',
      entityType: 'SSO',
      entityId: createdSSOEntries[0]?.id,
      oldValues: null,
      newValues: JSON.stringify({
        sso_url: 'https://app.example.com/dashboard',
        login_time: new Date(Date.now() - 2 * 60 * 60 * 1000),
        device_ip: '192.168.1.100'
      }),
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      notificationTemplateId: userLoginNotificationTemplate?.id,
      notificationSent: true,
    },
    {
      userId: adminUser?.id || '',
      action: 'sso_login',
      entityType: 'SSO',
      entityId: createdSSOEntries[1]?.id,
      oldValues: null,
      newValues: JSON.stringify({
        sso_url: 'https://admin.example.com/panel',
        login_time: new Date(Date.now() - 30 * 60 * 1000),
        device_ip: '10.0.0.50'
      }),
      ipAddress: '10.0.0.50',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      notificationTemplateId: userLoginNotificationTemplate?.id,
      notificationSent: true,
    },

    // SSO key regeneration
    {
      userId: adminUser?.id || '',
      action: 'sso_key_regenerated',
      entityType: 'SSO',
      entityId: createdSSOEntries[1]?.id,
      oldValues: JSON.stringify({
        key: 'old_sso_key_12345'
      }),
      newValues: JSON.stringify({
        key: 'sso_key_abcdef1234567890'
      }),
      ipAddress: '10.0.0.50',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      notificationTemplateId: null,
      notificationSent: false,
    },

    // Profile updates via SSO
    {
      userId: regularUser?.id || '',
      action: 'profile_updated',
      entityType: 'User',
      entityId: regularUser?.id,
      oldValues: JSON.stringify({
        nickname: 'Old Nickname',
        last_login: '2024-10-10T10:00:00Z'
      }),
      newValues: JSON.stringify({
        nickname: 'User',
        last_login: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      }),
      ipAddress: '172.16.0.10',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      notificationTemplateId: profileUpdatedNotificationTemplate?.id,
      notificationSent: false,
    },

    // SSO logout
    {
      userId: regularUser?.id || '',
      action: 'sso_logout',
      entityType: 'SSO',
      entityId: createdSSOEntries[4]?.id,
      oldValues: JSON.stringify({
        status: 'active',
        logout_time: null
      }),
      newValues: JSON.stringify({
        status: 'logged_out',
        logout_time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      }),
      ipAddress: '203.0.113.45',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      notificationTemplateId: null,
      notificationSent: false,
    }
  ];

  for (const logicHistory of logicHistoryEntries) {
    if (logicHistory.userId) {
      // Check if a similar logic history entry exists to avoid duplicates
      const existingEntry = await prisma.logicHistory.findFirst({
        where: {
          userId: logicHistory.userId,
          action: logicHistory.action,
          entityType: logicHistory.entityType,
          entityId: logicHistory.entityId,
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Within last 5 minutes
            lte: new Date(Date.now() + 5 * 60 * 1000)  // Within next 5 minutes (for time variations)
          }
        }
      });
      
      if (!existingEntry) {
        await prisma.logicHistory.create({
          data: logicHistory
        });
      }
    }
  }

  // Seed AI Agents
  console.log('🤖 Seeding AI Agents...');
  
  const aiAgents = [
    {
      userId: superadminUser?.id || '',
      name: 'General Assistant',
      description: 'A versatile AI assistant for general tasks and conversations',
      model: 'gpt-4',
      personality: JSON.stringify({
        traits: ['helpful', 'friendly', 'professional', 'knowledgeable'],
        tone: 'professional but approachable',
        style: 'concise yet comprehensive',
        expertise: ['general knowledge', 'problem solving', 'analysis']
      }),
      systemPrompt: 'You are a helpful AI assistant. Provide accurate, helpful, and professional responses while maintaining a friendly tone. Always aim to be informative and supportive.',
      config: JSON.stringify({
        temperature: 0.7,
        maxTokens: 1000,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0
      }),
      isActive: true
    },
    {
      userId: superadminUser?.id || '',
      name: 'Code Assistant',
      description: 'Specialized AI assistant for programming and technical support',
      model: 'gpt-4',
      personality: JSON.stringify({
        traits: ['analytical', 'precise', 'helpful', 'technical'],
        tone: 'technical but clear',
        style: 'detailed explanations with examples',
        expertise: ['programming', 'debugging', 'architecture', 'best practices']
      }),
      systemPrompt: 'You are an expert programming assistant. Help with code review, debugging, architecture decisions, and best practices. Provide clear explanations and working code examples.',
      config: JSON.stringify({
        temperature: 0.3,
        maxTokens: 2000,
        topP: 0.95,
        frequencyPenalty: 0,
        presencePenalty: 0
      }),
      isActive: true
    },
    {
      userId: adminUser?.id || '',
      name: 'Business Analyst',
      description: 'AI assistant focused on business analysis and decision support',
      model: 'gpt-4-turbo',
      personality: JSON.stringify({
        traits: ['analytical', 'strategic', 'data-driven', 'insightful'],
        tone: 'professional and strategic',
        style: 'structured analysis with actionable insights',
        expertise: ['business analysis', 'data interpretation', 'strategic planning', 'market research']
      }),
      systemPrompt: 'You are a business analysis expert. Provide strategic insights, data analysis, market research, and actionable business recommendations. Focus on practical solutions and measurable outcomes.',
      config: JSON.stringify({
        temperature: 0.5,
        maxTokens: 1500,
        topP: 0.9,
        frequencyPenalty: 0.1,
        presencePenalty: 0.1
      }),
      isActive: true
    },
    {
      userId: adminUser?.id || '',
      name: 'Creative Writer',
      description: 'AI assistant specialized in creative writing and content creation',
      model: 'gpt-4',
      personality: JSON.stringify({
        traits: ['creative', 'imaginative', 'eloquent', 'inspiring'],
        tone: 'creative and engaging',
        style: 'vivid and expressive',
        expertise: ['creative writing', 'storytelling', 'content creation', 'marketing copy']
      }),
      systemPrompt: 'You are a creative writing expert. Help with storytelling, content creation, marketing copy, and creative projects. Use vivid language and engaging narratives.',
      config: JSON.stringify({
        temperature: 0.8,
        maxTokens: 1200,
        topP: 0.95,
        frequencyPenalty: 0.2,
        presencePenalty: 0.2
      }),
      isActive: false
    },
    {
      userId: regularUser?.id || '',
      name: 'Learning Companion',
      description: 'Patient AI tutor for learning and educational support',
      model: 'gpt-3.5-turbo',
      personality: JSON.stringify({
        traits: ['patient', 'encouraging', 'knowledgeable', 'supportive'],
        tone: 'friendly and educational',
        style: 'step-by-step explanations with encouragement',
        expertise: ['education', 'tutoring', 'skill development', 'learning strategies']
      }),
      systemPrompt: 'You are a patient and encouraging tutor. Break down complex topics into understandable steps, provide examples, and offer positive reinforcement. Adapt your teaching style to the learner\'s pace.',
      config: JSON.stringify({
        temperature: 0.6,
        maxTokens: 800,
        topP: 0.9,
        frequencyPenalty: 0,
        presencePenalty: 0
      }),
      isActive: true
    }
  ];

  const createdAgents = [];
  for (const agent of aiAgents) {
    if (agent.userId) {
      try {
        const existingAgent = await prisma.agent.findFirst({
          where: { userId: agent.userId, name: agent.name },
          include: {
            user: {
              select: { id: true, email: true, nickname: true, status: true }
            }
          }
        });
        
        if (!existingAgent) {
          const createdAgent = await prisma.agent.create({
            data: agent,
            include: {
              user: {
                select: { id: true, email: true, nickname: true, status: true }
              }
            }
          });
          createdAgents.push(createdAgent);
          console.log(`✓ Created AI agent: ${agent.name} (Owner: ${createdAgent.user?.nickname}, Status: ${agent.isActive ? 'Active' : 'Inactive'})`);
        } else {
          createdAgents.push(existingAgent);
          console.log(`⚠ Agent already exists: ${agent.name} (Owner: ${existingAgent.user?.nickname}, Status: ${existingAgent.isActive ? 'Active' : 'Inactive'})`);
        }
      } catch (error) {
        console.log(`⚠ Error creating agent ${agent.name}:`, error);
      }
    }
  }

  // Seed Agent Memories
  console.log('🧠 Seeding Agent Memories...');
  
  const agentMemories = [
    // General Assistant memories
    {
      agentId: createdAgents[0]?.id,
      type: 'knowledge_base',
      content: 'User prefers concise explanations over lengthy responses',
      importance: 8,
      metadata: JSON.stringify({
        source: 'user_feedback',
        tags: ['preference', 'communication'],
        date: '2025-10-15'
      })
    },
    {
      agentId: createdAgents[0]?.id,
      type: 'long_term',
      content: 'User is working on a React project with TypeScript',
      importance: 7,
      metadata: JSON.stringify({
        source: 'conversation',
        tags: ['project', 'technology'],
        date: '2025-10-14'
      })
    },
    // Code Assistant memories
    {
      agentId: createdAgents[1]?.id,
      type: 'knowledge_base',
      content: 'User follows clean code principles and prefers functional programming patterns',
      importance: 9,
      metadata: JSON.stringify({
        source: 'code_review',
        tags: ['coding_style', 'preference'],
        date: '2025-10-13'
      })
    },
    {
      agentId: createdAgents[1]?.id,
      type: 'short_term',
      content: 'Currently debugging TypeScript compilation errors in middleware',
      importance: 6,
      metadata: JSON.stringify({
        source: 'current_task',
        tags: ['debugging', 'typescript'],
        date: '2025-10-15'
      })
    },
    // Business Analyst memories
    {
      agentId: createdAgents[2]?.id,
      type: 'knowledge_base',
      content: 'Company is focusing on AI integration and digital transformation initiatives',
      importance: 9,
      metadata: JSON.stringify({
        source: 'strategic_planning',
        tags: ['company_strategy', 'ai', 'transformation'],
        date: '2025-10-10'
      })
    }
  ];

  for (const memory of agentMemories) {
    if (memory.agentId) {
      try {
        const existingMemory = await prisma.agentMemory.findFirst({
          where: { agentId: memory.agentId, content: memory.content }
        });
        
        if (!existingMemory) {
          await prisma.agentMemory.create({
            data: memory
          });
          console.log(`✓ Created memory for agent ${memory.agentId}`);
        }
      } catch (error) {
        console.log(`⚠ Error creating memory:`, error);
      }
    }
  }

  // Seed Conversations
  console.log('💬 Seeding Conversations...');
  
  const conversations = [
    {
      agentId: createdAgents[0]?.id,
      userId: superadminUser?.id || '',
      title: 'Getting Started with AI Agents',
      summary: 'Initial conversation about setting up and configuring AI agents for the platform (Priority: High, Category: Onboarding)',
      isActive: true
    },
    {
      agentId: createdAgents[1]?.id,
      userId: superadminUser?.id || '',
      title: 'Code Review Session',
      summary: 'Discussion about TypeScript implementation and best practices for API middleware (Priority: Medium, Category: Development)',
      isActive: true
    },
    {
      agentId: createdAgents[2]?.id,
      userId: adminUser?.id || '',
      title: 'Business Strategy Discussion',
      summary: 'Analysis of AI integration opportunities and market positioning (Priority: High, Category: Strategy)',
      isActive: true
    },
    {
      agentId: createdAgents[4]?.id,
      userId: regularUser?.id || '',
      title: 'Learning TypeScript',
      summary: 'Step-by-step tutorial for learning TypeScript fundamentals (Priority: Low, Category: Education)',
      isActive: true
    },
    {
      agentId: createdAgents[3]?.id,
      userId: adminUser?.id || '',
      title: 'Creative Writing Project',
      summary: 'Collaboration on creative content and marketing materials (Priority: Low, Category: Creative)',
      isActive: false
    },
    {
      agentId: createdAgents[0]?.id,
      userId: regularUser?.id || '',
      title: 'General Questions',
      summary: 'Various questions about platform features and functionality (Priority: Medium, Category: Support)',
      isActive: true
    },
    // Additional conversations for more comprehensive testing
    {
      agentId: createdAgents[1]?.id,
      userId: adminUser?.id || '',
      title: 'API Performance Optimization',
      summary: 'Analyzing and improving API response times and database query performance (Priority: High, Category: Performance)',
      isActive: true
    },
    {
      agentId: createdAgents[2]?.id,
      userId: superadminUser?.id || '',
      title: 'Quarterly Business Review',
      summary: 'Comprehensive analysis of quarterly metrics and strategic recommendations (Priority: High, Category: Business Review)',
      isActive: true
    },
    {
      agentId: createdAgents[4]?.id,
      userId: adminUser?.id || '',
      title: 'Advanced React Patterns',
      summary: 'Deep dive into advanced React patterns and state management solutions (Priority: Medium, Category: Education)',
      isActive: true
    },
    {
      agentId: createdAgents[0]?.id,
      userId: adminUser?.id || '',
      title: 'System Integration Planning',
      summary: 'Planning integration with third-party services and API endpoints (Priority: Medium, Category: Integration)',
      isActive: false
    },
    {
      agentId: createdAgents[3]?.id,
      userId: regularUser?.id || '',
      title: 'Blog Content Strategy',
      summary: 'Developing content strategy and writing guidelines for company blog (Priority: Low, Category: Content)',
      isActive: true
    },
    {
      agentId: createdAgents[1]?.id,
      userId: regularUser?.id || '',
      title: 'Debugging Session',
      summary: 'Troubleshooting complex bug in user authentication flow (Priority: High, Category: Debugging)',
      isActive: true
    }
  ];

  const createdConversations = [];
  for (const conversation of conversations) {
    if (conversation.agentId && conversation.userId) {
      try {
        const existingConversation = await prisma.conversation.findFirst({
          where: { 
            agentId: conversation.agentId, 
            userId: conversation.userId, 
            title: conversation.title 
          },
          include: {
            user: {
              select: { id: true, email: true, nickname: true, status: true }
            },
            agent: {
              select: { id: true, name: true, description: true, model: true, isActive: true }
            }
          }
        });
        
        if (!existingConversation) {
          const createdConversation = await prisma.conversation.create({
            data: conversation,
            include: {
              user: {
                select: { id: true, email: true, nickname: true, status: true }
              },
              agent: {
                select: { id: true, name: true, description: true, model: true, isActive: true }
              }
            }
          });
          createdConversations.push(createdConversation);
          console.log(`✓ Created conversation: ${conversation.title} (User: ${createdConversation.user?.nickname}, Agent: ${createdConversation.agent?.name}, Status: ${conversation.isActive ? 'Active' : 'Inactive'})`);
        } else {
          createdConversations.push(existingConversation);
          console.log(`✓ Found existing conversation: ${conversation.title} (Status: ${existingConversation.isActive ? 'Active' : 'Inactive'})`);
        }
      } catch (error) {
        console.log(`⚠ Error creating conversation:`, error);
      }
    }
  }

  // Seed Messages
  console.log('📝 Seeding Messages...');
  
  const messages = [
    // Getting Started conversation (Enhanced)
    {
      conversationId: createdConversations[0]?.id,
      sender: 'user',
      content: 'Hi! I\'d like to learn how to set up AI agents effectively. Can you guide me through the process?',
      metadata: JSON.stringify({ timestamp: Date.now() - 3600000, device: 'desktop' })
    },
    {
      conversationId: createdConversations[0]?.id,
      sender: 'agent',
      content: 'Hello! I\'d be happy to help you set up AI agents. Let\'s start with the basics:\n\n1. **Define the Purpose**: What specific tasks do you want your agent to handle?\n2. **Choose the Right Model**: Select between GPT-4 for complex tasks or GPT-3.5 for simpler ones\n3. **Configure Personality**: Set traits and tone that match your use case\n4. **Write System Prompts**: Create clear instructions for consistent behavior\n\nWhat type of AI agent are you looking to create?',
      tokens: 85,
      metadata: JSON.stringify({ response_time: 1200, model_used: 'gpt-4' })
    },
    {
      conversationId: createdConversations[0]?.id,
      sender: 'user',
      content: 'I want to create a customer support agent that can handle common inquiries about our SaaS platform. It should be professional but friendly.',
      metadata: JSON.stringify({ timestamp: Date.now() - 3500000, device: 'desktop' })
    },
    {
      conversationId: createdConversations[0]?.id,
      sender: 'agent',
      content: 'Perfect! A customer support agent is an excellent starting point. Here\'s how to configure it:\n\n**Model Selection:** GPT-4 for better understanding of complex queries\n\n**Personality Configuration:**\n```json\n{\n  "traits": ["helpful", "patient", "professional", "empathetic"],\n  "tone": "friendly and professional",\n  "style": "clear and solution-focused"\n}\n```\n\n**System Prompt Example:**\n"You are a helpful customer support agent for [Company]. Always be polite, provide accurate information, and escalate complex technical issues to human agents when necessary."\n\n**Key Features to Enable:**\n• Knowledge base integration\n• Ticket creation capability\n• Escalation workflows\n• Response templates\n\nWould you like me to help you write the complete system prompt?',
      tokens: 156,
      metadata: JSON.stringify({ response_time: 1800, model_used: 'gpt-4' })
    },

    // Code Review conversation (Enhanced)
    {
      conversationId: createdConversations[1]?.id,
      sender: 'user',
      content: 'I\'m having TypeScript compilation errors in my API middleware. The compiler complains about null handling and response override issues.',
      metadata: JSON.stringify({ timestamp: Date.now() - 7200000, device: 'desktop' })
    },
    {
      conversationId: createdConversations[1]?.id,
      sender: 'agent',
      content: 'I can help you resolve those TypeScript issues. Common middleware problems include:\n\n**Null Handling:**\n```typescript\n// Use optional chaining and nullish coalescing\nconst userId = req.user?.id ?? null;\nif (!userId) {\n  return res.status(401).json({ error: \'Unauthorized\' });\n}\n```\n\n**Response Override:**\n```typescript\n// Ensure proper typing for response methods\nres.status(200).json({ data }).end();\n// Or use proper middleware flow\nnext();\n```\n\nCould you share the specific error messages?',
      tokens: 120,
      metadata: JSON.stringify({ response_time: 900, model_used: 'gpt-4' })
    },
    {
      conversationId: createdConversations[1]?.id,
      sender: 'user',
      content: 'Here are the errors:\n1. "Object is possibly \'null\'" on req.user.id\n2. "Cannot redeclare block-scoped variable \'res\'" in middleware chain\n3. "Type \'void\' is not assignable to type \'Response\'"\n\nThe middleware is for JWT authentication and user permission checking.',
      metadata: JSON.stringify({ timestamp: Date.now() - 7100000, device: 'desktop' })
    },
    {
      conversationId: createdConversations[1]?.id,
      sender: 'agent',
      content: 'I see the issues! Let me provide specific solutions:\n\n**1. Null Safety (req.user.id):**\n```typescript\ninterface AuthenticatedRequest extends Request {\n  user?: { id: string; role: string } | null;\n}\n\n// In middleware:\nif (!req.user?.id) {\n  return res.status(401).json({ error: \'User not authenticated\' });\n}\n// Now TypeScript knows req.user.id exists\nconst userId: string = req.user.id;\n```\n\n**2. Variable Redeclaration:**\n```typescript\n// Don\'t redeclare res, use the existing one\nexport const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {\n  // Your logic here\n};\n```\n\n**3. Return Type Issue:**\n```typescript\n// Middleware should return void or call next()\nif (!isAuthorized) {\n  return res.status(403).json({ error: \'Forbidden\' }); // This returns void\n}\nnext(); // Continue to next middleware\n```\n\nWant me to review your complete middleware code?',
      tokens: 198,
      metadata: JSON.stringify({ response_time: 2100, model_used: 'gpt-4' })
    },

    // Business Strategy conversation (Enhanced)
    {
      conversationId: createdConversations[2]?.id,
      sender: 'user',
      content: 'What are the key opportunities for AI integration in our current business model?',
      metadata: JSON.stringify({ timestamp: Date.now() - 14400000, device: 'desktop' })
    },
    {
      conversationId: createdConversations[2]?.id,
      sender: 'agent',
      content: 'Based on current market trends and your business context, here are key AI integration opportunities:\n\n**Immediate Opportunities (0-6 months):**\n• **Customer Support**: AI chatbots for 24/7 service\n• **Content Creation**: Automated documentation and marketing copy\n• **Data Analysis**: Intelligent insights from business metrics\n• **Lead Qualification**: Automated lead scoring and routing\n\n**Strategic Advantages (6-12 months):**\n• **Personalization**: Tailored user experiences and recommendations\n• **Process Automation**: Streamlined workflows and approvals\n• **Predictive Analytics**: Forecasting and trend analysis\n• **Competitive Intelligence**: Market monitoring and analysis\n\n**ROI Potential:**\n• 30-40% reduction in support costs\n• 50% faster content production\n• 25% improvement in lead conversion\n• 60% reduction in manual data processing\n\nWhich area aligns best with your current priorities and budget?',
      tokens: 168,
      metadata: JSON.stringify({ response_time: 1500, model_used: 'gpt-4-turbo' })
    },
    {
      conversationId: createdConversations[2]?.id,
      sender: 'user',
      content: 'Customer support seems like the best starting point. We\'re getting about 200 tickets per day, and our response time is currently 4-6 hours. What\'s the implementation roadmap?',
      metadata: JSON.stringify({ timestamp: Date.now() - 14300000, device: 'desktop' })
    },
    {
      conversationId: createdConversations[2]?.id,
      sender: 'agent',
      content: 'Excellent choice! With 200 daily tickets, AI can significantly impact your operations. Here\'s a phased implementation roadmap:\n\n**Phase 1: Foundation (Weeks 1-4)**\n• Ticket categorization and routing\n• Knowledge base integration\n• Basic FAQ automation\n• Expected impact: 30% ticket reduction\n\n**Phase 2: Intelligence (Weeks 5-8)**\n• Intent recognition and smart responses\n• Conversation handoff to human agents\n• Sentiment analysis and priority scoring\n• Expected impact: 50% faster first response\n\n**Phase 3: Optimization (Weeks 9-12)**\n• Machine learning from agent interactions\n• Proactive issue detection\n• Multi-language support\n• Expected impact: 70% automation rate\n\n**Investment Requirements:**\n• Initial setup: $15K-25K\n• Monthly operational: $2K-5K\n• Training and integration: 2-3 FTE weeks\n\n**ROI Timeline:**\n• Break-even: Month 4-5\n• Full ROI: Month 8-10\n\nShall we dive deeper into Phase 1 technical requirements?',
      tokens: 204,
      metadata: JSON.stringify({ response_time: 2200, model_used: 'gpt-4-turbo' })
    },

    // Learning TypeScript conversation (Enhanced)
    {
      conversationId: createdConversations[3]?.id,
      sender: 'user',
      content: 'I\'m new to TypeScript and coming from JavaScript. What\'s the best learning path?',
      metadata: JSON.stringify({ timestamp: Date.now() - 21600000, device: 'mobile' })
    },
    {
      conversationId: createdConversations[3]?.id,
      sender: 'agent',
      content: 'Welcome to TypeScript! Since you have JavaScript experience, you\'re already ahead. Here\'s a structured learning path:\n\n**Week 1: Foundations**\n• Basic types (string, number, boolean, arrays)\n• Type annotations and inference\n• Interfaces and type aliases\n• Practice: Convert simple JS functions to TS\n\n**Week 2: Advanced Types**\n• Union and intersection types\n• Generics basics\n• Function types and overloads\n• Practice: Build a typed utility library\n\n**Week 3: Real-world Application**\n• Classes and inheritance\n• Modules and namespaces\n• Working with external libraries\n• Practice: Convert a small JS project\n\n**Week 4: Advanced Concepts**\n• Advanced generics\n• Conditional types\n• Utility types (Pick, Omit, etc.)\n• Practice: Build a type-safe API client\n\n**Resources:**\n• TypeScript Handbook (official docs)\n• TypeScript Playground for experimentation\n• Practice exercises: type-challenges on GitHub\n\nWould you like to start with a specific concept, or do you have a particular project in mind?',
      tokens: 189,
      metadata: JSON.stringify({ response_time: 1400, model_used: 'gpt-3.5-turbo' })
    },

    // Additional conversations for better testing coverage
    // API Performance Optimization conversation
    {
      conversationId: createdConversations[6]?.id,
      sender: 'user',
      content: 'Our API response times have increased to 2-3 seconds under load. Database queries seem to be the bottleneck. How can we optimize this?',
      metadata: JSON.stringify({ timestamp: Date.now() - 28800000, device: 'desktop' })
    },
    {
      conversationId: createdConversations[6]?.id,
      sender: 'agent',
      content: 'API performance issues with database bottlenecks are common but solvable. Let\'s analyze the problem systematically:\n\n**1. Query Analysis:**\n• Identify N+1 query problems\n• Review query execution plans\n• Check for missing indexes\n• Analyze slow query logs\n\n**2. Immediate Optimizations:**\n```sql\n-- Add composite indexes for common queries\nCREATE INDEX idx_user_status_created ON users(status, created_at);\n\n-- Use SELECT specific fields instead of *\nSELECT id, name, email FROM users WHERE status = \'active\';\n```\n\n**3. Caching Strategy:**\n• Redis for frequently accessed data\n• Application-level query result caching\n• Database query plan caching\n\n**4. Database Connection Optimization:**\n• Connection pooling configuration\n• Prepared statement usage\n• Read replica implementation\n\nCan you share some of your most frequent/slow queries? I\'ll provide specific optimization recommendations.',
      tokens: 167,
      metadata: JSON.stringify({ response_time: 1600, model_used: 'gpt-4' })
    },

    // Quarterly Business Review conversation
    {
      conversationId: createdConversations[7]?.id,
      sender: 'user',
      content: 'I need to prepare our Q4 business review. What metrics should I focus on and how should I structure the analysis?',
      metadata: JSON.stringify({ timestamp: Date.now() - 86400000, device: 'desktop' })
    },
    {
      conversationId: createdConversations[7]?.id,
      sender: 'agent',
      content: 'A comprehensive Q4 business review should tell a complete story. Here\'s a strategic framework:\n\n**1. Executive Summary (5 minutes)**\n• Key achievements vs. goals\n• Critical metrics snapshot\n• Major challenges and solutions\n• Q1 outlook preview\n\n**2. Financial Performance (10 minutes)**\n• Revenue growth (YoY, QoQ)\n• Customer acquisition cost (CAC)\n• Lifetime value (LTV)\n• Monthly recurring revenue (MRR)\n• Churn rate and retention metrics\n\n**3. Operational Excellence (10 minutes)**\n• Customer satisfaction scores\n• Product adoption metrics\n• Team productivity indicators\n• Process improvement outcomes\n\n**4. Market & Competitive Analysis (5 minutes)**\n• Market share evolution\n• Competitive positioning\n• New market opportunities\n\n**5. Strategic Initiatives (10 minutes)**\n• Innovation pipeline\n• Technology investments\n• Partnership developments\n• Talent acquisition\n\n**Key Visualizations:**\n• Trend charts for growth metrics\n• Cohort analysis for retention\n• Geographic/segment breakdowns\n• Funnel analysis for conversion\n\nWhat\'s your primary business model? This will help me customize the metrics framework.',
      tokens: 223,
      metadata: JSON.stringify({ response_time: 2500, model_used: 'gpt-4-turbo' })
    },

    // Debugging Session conversation
    {
      conversationId: createdConversations[11]?.id,
      sender: 'user',
      content: 'I have a weird bug where users are getting logged out randomly, but only on mobile devices. The session appears valid in the database, but the frontend shows "unauthorized". Any debugging strategies?',
      metadata: JSON.stringify({ timestamp: Date.now() - 43200000, device: 'desktop' })
    },
    {
      conversationId: createdConversations[11]?.id,
      sender: 'agent',
      content: 'Mobile-specific authentication issues are tricky! Let\'s debug this systematically:\n\n**1. Data Collection:**\n```javascript\n// Add comprehensive logging\nconsole.log(\'Session Debug:\', {\n  sessionId: req.sessionID,\n  userId: req.session?.userId,\n  userAgent: req.get(\'User-Agent\'),\n  timestamp: new Date().toISOString(),\n  cookies: req.headers.cookie\n});\n```\n\n**2. Common Mobile Issues:**\n• **iOS Safari**: Aggressive cookie clearing\n• **Android Chrome**: Different session handling\n• **Background app refresh**: Session interruption\n• **Network switching**: WiFi ↔ Cellular transitions\n\n**3. Investigation Steps:**\n```javascript\n// Check session middleware configuration\napp.use(session({\n  cookie: {\n    secure: process.env.NODE_ENV === \'production\', // HTTPS only\n    sameSite: \'lax\', // Mobile compatibility\n    maxAge: 24 * 60 * 60 * 1000 // 24 hours\n  },\n  rolling: true // Reset expiry on activity\n}));\n```\n\n**4. Debugging Tools:**\n• Browser dev tools on mobile (Chrome://inspect)\n• Network tab to check cookie transmission\n• Application tab to verify localStorage/sessionStorage\n\nCan you check if the issue occurs:\n1. Only on specific mobile browsers?\n2. After the app goes to background?\n3. When switching networks?\n\nThis will help narrow down the root cause.',
      tokens: 267,
      metadata: JSON.stringify({ response_time: 1900, model_used: 'gpt-4' })
    }
  ];

  for (const message of messages) {
    if (message.conversationId) {
      try {
        const existingMessage = await prisma.message.findFirst({
          where: { 
            conversationId: message.conversationId, 
            content: message.content 
          }
        });
        
        if (!existingMessage) {
          await prisma.message.create({
            data: message
          });
          console.log(`✓ Created message in conversation ${message.conversationId}`);
        }
      } catch (error) {
        console.log(`⚠ Error creating message:`, error);
      }
    }
  }

  // Seed Agent Tools
  console.log('🛠️ Seeding Agent Tools...');
  
  const agentTools = [
    {
      agentId: createdAgents[0]?.id,
      name: 'web_search',
      type: 'api',
      config: JSON.stringify({
        apiKey: 'demo_search_key',
        maxResults: 5,
        safeSearch: true,
        language: 'en'
      }),
      enabled: true
    },
    {
      agentId: createdAgents[0]?.id,
      name: 'calculator',
      type: 'function',
      config: JSON.stringify({
        precision: 10,
        allowedOperations: ['basic', 'scientific']
      }),
      enabled: true
    },
    {
      agentId: createdAgents[1]?.id,
      name: 'code_analyzer',
      type: 'function',
      config: JSON.stringify({
        languages: ['javascript', 'typescript', 'python', 'java'],
        analysisTypes: ['syntax', 'security', 'performance', 'style']
      }),
      enabled: true
    },
    {
      agentId: createdAgents[2]?.id,
      name: 'data_visualizer',
      type: 'plugin',
      config: JSON.stringify({
        chartTypes: ['line', 'bar', 'pie', 'scatter'],
        exportFormats: ['png', 'svg', 'pdf']
      }),
      enabled: true
    }
  ];

  for (const tool of agentTools) {
    if (tool.agentId) {
      try {
        const existingTool = await prisma.agentTool.findFirst({
          where: { agentId: tool.agentId, name: tool.name }
        });
        
        if (!existingTool) {
          await prisma.agentTool.create({
            data: tool
          });
          console.log(`✓ Created tool ${tool.name} for agent ${tool.agentId}`);
        }
      } catch (error) {
        console.log(`⚠ Error creating tool:`, error);
      }
    }
  }

  // Seed Agent Tasks
  console.log('📋 Seeding Agent Tasks...');
  
  const agentTasks = [
    {
      agentId: createdAgents[0]?.id,
      name: 'Daily Summary Report',
      input: JSON.stringify({
        reportType: 'daily',
        metrics: ['user_activity', 'system_performance', 'error_rates'],
        format: 'summary'
      }),
      status: 'completed',
      output: JSON.stringify({
        summary: 'System performed well with 99.8% uptime, 1,247 active users, and minimal errors',
        metrics: {
          uptime: '99.8%',
          activeUsers: 1247,
          errorRate: '0.1%'
        }
      }),
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      agentId: createdAgents[1]?.id,
      name: 'Code Quality Analysis',
      input: JSON.stringify({
        repository: 'auth-api',
        analysisType: 'full',
        includeTests: true
      }),
      status: 'running',
      startedAt: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      agentId: createdAgents[2]?.id,
      name: 'Market Research Report',
      input: JSON.stringify({
        industry: 'AI SaaS',
        competitors: ['OpenAI', 'Anthropic', 'Cohere'],
        focusAreas: ['pricing', 'features', 'market_share']
      }),
      status: 'pending'
    },
    {
      agentId: createdAgents[4]?.id,
      name: 'Learning Path Generation',
      input: JSON.stringify({
        subject: 'TypeScript',
        skill_level: 'beginner',
        learning_goals: ['basic syntax', 'types', 'interfaces', 'functions']
      }),
      status: 'completed',
      output: JSON.stringify({
        learning_path: [
          'Introduction to TypeScript',
          'Basic Types and Variables',
          'Functions and Parameters',
          'Interfaces and Type Definitions',
          'Practice Exercises'
        ],
        estimated_time: '4-6 weeks'
      }),
      startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    {
      agentId: createdAgents[3]?.id,
      name: 'Content Creation Campaign',
      input: JSON.stringify({
        campaign_type: 'social_media',
        target_audience: 'tech_professionals',
        content_themes: ['AI innovation', 'developer tools', 'productivity']
      }),
      status: 'failed',
      error: 'Insufficient context provided for target audience analysis',
      startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
    }
  ];

  for (const task of agentTasks) {
    if (task.agentId) {
      try {
        const existingTask = await prisma.agentTask.findFirst({
          where: { agentId: task.agentId, name: task.name }
        });
        
        if (!existingTask) {
          const createdTask = await prisma.agentTask.create({
            data: task,
            include: {
              agent: {
                select: { 
                  name: true,
                  user: {
                    select: { nickname: true }
                  }
                }
              }
            }
          });
          console.log(`✓ Created task "${task.name}" for agent ${createdTask.agent?.name} (Status: ${task.status}, Owner: ${createdTask.agent?.user?.nickname})`);
        } else {
          console.log(`⚠ Task already exists: ${task.name} (Status: ${existingTask.status})`);
        }
      } catch (error) {
        console.log(`⚠ Error creating task:`, error);
      }
    }
  }

  console.log('✅ AI seeding completed successfully!');
  console.log('Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
