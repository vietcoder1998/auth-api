// Mock data for notification templates
export const mockNotificationTemplates = [
  {
    name: 'user_login',
    title: 'New Login Detected',
    body: "A new login was detected on your account from {{device}} at {{timestamp}}. If this wasn't you, please secure your account immediately.",
    active: true,
  },
  {
    name: 'profile_updated',
    title: 'Profile Updated',
    body: 'Your profile information has been successfully updated. The changes include: {{changes}}.',
    active: true,
  },
  {
    name: 'password_changed',
    title: 'Password Changed',
    body: "Your account password has been successfully changed. If you didn't make this change, please contact support immediately.",
    active: true,
  },
  {
    name: 'role_assigned',
    title: 'New Role Assigned',
    body: 'You have been assigned the role "{{role}}" by {{admin}}. Your new permissions are now active.',
    active: true,
  },
  {
    name: 'account_suspended',
    title: 'Account Suspended',
    body: 'Your account has been suspended due to {{reason}}. Please contact support for more information.',
    active: true,
  },
  {
    name: 'system_maintenance',
    title: 'Scheduled Maintenance',
    body: 'System maintenance is scheduled for {{date}} from {{start_time}} to {{end_time}}. Some services may be temporarily unavailable.',
    active: true,
  },
  {
    name: 'security_alert',
    title: 'Security Alert',
    body: 'Security alert: {{alert_type}} detected on your account. Please review your recent activity and update your security settings if necessary.',
    active: true,
  },
];
