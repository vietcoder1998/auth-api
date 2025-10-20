// Mock data for login history entries
export const mockLoginHistoryEntries = [
  // Superadmin login sessions
  {
    userEmail: 'superadmin@example.com',
    ssoKey: 'app_dashboard_sso',
    deviceIP: '192.168.1.100',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    location: 'New York, US',
    status: 'active',
    loginAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    logoutAt: null,
  },
  {
    userEmail: 'superadmin@example.com',
    ssoKey: 'app_dashboard_sso',
    deviceIP: '192.168.1.100',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    location: 'New York, US',
    status: 'logged_out',
    loginAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    logoutAt: new Date(Date.now() - 22 * 60 * 60 * 1000), // Logged out 22 hours ago
  },

  // Admin login sessions
  {
    userEmail: 'admin@example.com',
    ssoKey: 'admin_panel_sso',
    deviceIP: '10.0.0.50',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    location: 'San Francisco, US',
    status: 'active',
    loginAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    logoutAt: null,
  },
  {
    userEmail: 'admin@example.com',
    ssoKey: 'legacy_system_sso', // Using inactive SSO (legacy system)
    deviceIP: '192.168.1.200',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    location: 'Los Angeles, US',
    status: 'expired',
    loginAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
    logoutAt: null,
  },

  // Regular user login sessions
  {
    userEmail: 'user@example.com',
    ssoKey: 'user_portal_sso',
    deviceIP: '172.16.0.10',
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    location: 'Toronto, CA',
    status: 'active',
    loginAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    logoutAt: null,
  },
  {
    userEmail: 'user@example.com',
    ssoKey: 'mobile_app_sso', // Mobile app login
    deviceIP: '203.0.113.45',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    location: 'Vancouver, CA',
    status: 'logged_out',
    loginAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    logoutAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // Logged out 4 hours ago
  },
  {
    userEmail: 'user@example.com',
    ssoKey: 'user_portal_sso',
    deviceIP: '172.16.0.15', // Different IP (work vs home)
    userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
    location: 'Montreal, CA',
    status: 'logged_out',
    loginAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    logoutAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hour session
  },

  // Non-SSO (direct) login entries
  {
    userEmail: 'superadmin@example.com',
    ssoKey: null, // Direct login (no SSO)
    deviceIP: '192.168.1.101',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    location: 'New York, US',
    status: 'active',
    loginAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    logoutAt: null,
  },
  {
    userEmail: 'admin@example.com',
    ssoKey: null, // Direct login (no SSO)
    deviceIP: '10.0.0.51',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    location: 'San Francisco, US',
    status: 'logged_out',
    loginAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    logoutAt: new Date(Date.now() - 10 * 60 * 60 * 1000), // Logged out 10 hours ago
  },
  {
    userEmail: 'user@example.com',
    ssoKey: null, // Direct login (no SSO)
    deviceIP: '172.16.0.11',
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    location: 'Toronto, CA',
    status: 'expired',
    loginAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago (expired)
    logoutAt: null,
  },
];
