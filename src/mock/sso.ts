// Mock data for SSO entries
export const mockSSOEntries = [
  {
    url: 'https://app.example.com/dashboard',
    key: 'sso_key_1234567890abcdef',
    ssoKey: 'app_dashboard_sso',
    userEmail: 'superadmin@example.com',
    deviceIP: '192.168.1.100',
    isActive: true,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  },
  {
    url: 'https://admin.example.com/panel',
    key: 'sso_key_abcdef1234567890',
    ssoKey: 'admin_panel_sso',
    userEmail: 'admin@example.com',
    deviceIP: '10.0.0.50',
    isActive: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  },
  {
    url: 'https://portal.example.com/user',
    key: 'sso_key_fedcba0987654321',
    ssoKey: 'user_portal_sso',
    userEmail: 'user@example.com',
    deviceIP: '172.16.0.10',
    isActive: true,
    expiresAt: null, // No expiration
  },
  {
    url: 'https://old.example.com/legacy',
    key: 'sso_key_legacy123456',
    ssoKey: 'legacy_system_sso',
    userEmail: 'admin@example.com',
    deviceIP: '192.168.1.200',
    isActive: false, // Inactive SSO
    expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Expired 5 days ago
  },
  {
    url: 'https://mobile.example.com/app',
    key: 'sso_key_mobile987654',
    ssoKey: 'mobile_app_sso',
    userEmail: 'user@example.com',
    deviceIP: '203.0.113.45',
    isActive: true,
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
  }
];