// Sidebar menu config for seeding and UI usage
export const defaultSidebarMenu = [
  {
    key: '/admin',
    icon: 'HomeOutlined',
    label: 'Dashboard',
  },
  {
    key: '/admin/system',
    icon: 'DatabaseOutlined',
    label: 'System Management',
    children: [
      { key: '/admin/system/agents', icon: 'RobotOutlined', label: 'AI Agents' },
      { key: '/admin/system/conversations', icon: 'MessageOutlined', label: 'Conversations' },
      { key: '/admin/system/documents', icon: 'FileTextOutlined', label: 'Document List' },
      { key: '/admin/system/files', icon: 'FileOutlined', label: 'File List' },
      { key: '/admin/system/users', icon: 'UserOutlined', label: 'Users' },
      { key: '/admin/system/tokens', icon: 'KeyOutlined', label: 'Tokens' },
      { key: '/admin/system/roles', icon: 'TeamOutlined', label: 'Roles' },
      { key: '/admin/system/permissions', icon: 'SafetyOutlined', label: 'Permissions' },
      { key: '/admin/system/sso', icon: 'LinkOutlined', label: 'SSO Management' },
      { key: '/admin/system/login-history', icon: 'HistoryOutlined', label: 'Login History' },
      { key: '/admin/system/logic-history', icon: 'AuditOutlined', label: 'Logic History' },
      { key: '/admin/system/logs', icon: 'AuditOutlined', label: 'Application Logs' },
      { key: '/admin/system/cache', icon: 'DatabaseOutlined', label: 'Cache' },
      { key: '/admin/system/sockets', icon: 'ThunderboltOutlined', label: 'Socket Connections' },
    ],
  },
  {
    key: '/admin/settings',
    icon: 'SettingOutlined',
    label: 'Settings Management',
    children: [
      { key: '/admin/settings/api-keys', icon: 'KeyOutlined', label: 'API Keys' },
      { key: '/admin/settings/mail', icon: 'MailOutlined', label: 'Mail Templates' },
      { key: '/admin/settings/notifications', icon: 'BellOutlined', label: 'Notifications' },
      { key: '/admin/settings/config', icon: 'SettingOutlined', label: 'Configuration' },
      { key: '/admin/settings/seed', icon: 'DatabaseOutlined', label: 'Database Seed' },
      {
        key: '/admin/settings/database',
        icon: 'DatabaseOutlined',
        label: 'Database Connections',
      },
    ],
  },
];
