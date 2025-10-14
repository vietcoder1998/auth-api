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
    
    // Route-based permissions
    { name: 'admin_users_get', description: 'GET admin users endpoint', category: 'api', route: '/api/admin/users', method: 'GET' },
    { name: 'admin_users_post', description: 'POST admin users endpoint', category: 'api', route: '/api/admin/users', method: 'POST' },
    { name: 'admin_users_put', description: 'PUT admin users endpoint', category: 'api', route: '/api/admin/users/:id', method: 'PUT' },
    { name: 'admin_users_delete', description: 'DELETE admin users endpoint', category: 'api', route: '/api/admin/users/:id', method: 'DELETE' },
    
    { name: 'admin_roles_get', description: 'GET admin roles endpoint', category: 'api', route: '/api/admin/roles', method: 'GET' },
    { name: 'admin_roles_post', description: 'POST admin roles endpoint', category: 'api', route: '/api/admin/roles', method: 'POST' },
    { name: 'admin_roles_put', description: 'PUT admin roles endpoint', category: 'api', route: '/api/admin/roles/:id', method: 'PUT' },
    { name: 'admin_roles_delete', description: 'DELETE admin roles endpoint', category: 'api', route: '/api/admin/roles/:id', method: 'DELETE' },
    
    // Additional admin endpoints permissions
    { name: 'admin_permissions_get', description: 'GET admin permissions endpoint', category: 'api', route: '/api/admin/permissions', method: 'GET' },
    { name: 'admin_permissions_post', description: 'POST admin permissions endpoint', category: 'api', route: '/api/admin/permissions', method: 'POST' },
    { name: 'admin_permissions_put', description: 'PUT admin permissions endpoint', category: 'api', route: '/api/admin/permissions/:id', method: 'PUT' },
    { name: 'admin_permissions_delete', description: 'DELETE admin permissions endpoint', category: 'api', route: '/api/admin/permissions/:id', method: 'DELETE' },
    
    { name: 'admin_tokens_get', description: 'GET admin tokens endpoint', category: 'api', route: '/api/admin/tokens', method: 'GET' },
    { name: 'admin_tokens_post', description: 'POST admin tokens endpoint', category: 'api', route: '/api/admin/tokens', method: 'POST' },
    { name: 'admin_tokens_delete', description: 'DELETE admin tokens endpoint', category: 'api', route: '/api/admin/tokens/:id', method: 'DELETE' },
    
    { name: 'admin_mail_templates_get', description: 'GET admin mail templates endpoint', category: 'api', route: '/api/admin/mail-templates', method: 'GET' },
    { name: 'admin_mail_templates_post', description: 'POST admin mail templates endpoint', category: 'api', route: '/api/admin/mail-templates', method: 'POST' },
    { name: 'admin_mail_templates_put', description: 'PUT admin mail templates endpoint', category: 'api', route: '/api/admin/mail-templates/:id', method: 'PUT' },
    { name: 'admin_mail_templates_delete', description: 'DELETE admin mail templates endpoint', category: 'api', route: '/api/admin/mail-templates/:id', method: 'DELETE' },
    
    { name: 'admin_notification_templates_get', description: 'GET admin notification templates endpoint', category: 'api', route: '/api/admin/notification-templates', method: 'GET' },
    { name: 'admin_notification_templates_post', description: 'POST admin notification templates endpoint', category: 'api', route: '/api/admin/notification-templates', method: 'POST' },
    { name: 'admin_notification_templates_put', description: 'PUT admin notification templates endpoint', category: 'api', route: '/api/admin/notification-templates/:id', method: 'PUT' },
    { name: 'admin_notification_templates_delete', description: 'DELETE admin notification templates endpoint', category: 'api', route: '/api/admin/notification-templates/:id', method: 'DELETE' },
    
    { name: 'admin_mails_get', description: 'GET admin mails endpoint', category: 'api', route: '/api/admin/mails', method: 'GET' },
    { name: 'admin_mails_post', description: 'POST admin mails endpoint', category: 'api', route: '/api/admin/mails', method: 'POST' },
    
    { name: 'admin_cache_get', description: 'GET admin cache endpoint', category: 'api', route: '/api/admin/cache', method: 'GET' },
    { name: 'admin_cache_delete', description: 'DELETE admin cache endpoint', category: 'api', route: '/api/admin/cache', method: 'DELETE' }
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
    update: {},
    create: {
      name: 'superadmin',
      permissions: {
        connect: permissionRecords.map(p => ({ id: p.id }))
      }
    }
  });
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      permissions: {
        connect: permissionRecords.filter(p => ['manage_users', 'view_reports'].includes(p.name)).map(p => ({ id: p.id }))
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

  console.log('Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
