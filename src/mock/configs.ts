// Mock data for system configuration
export const mockConfigs = [
  { key: 'cors_origin', value: 'http://localhost:3000' },
  { key: 'app_name', value: 'Auth API Platform' },
  { key: 'jwt_expiry', value: '24h' },
  { key: 'max_login_attempts', value: '5' },
  { key: 'session_timeout', value: '3600' },
  { 
    key: 'email_settings', 
    value: JSON.stringify({
      smtp_host: 'smtp.gmail.com',
      smtp_port: 587,
      smtp_secure: false,
      from_email: 'noreply@example.com',
      from_name: 'Auth API Platform'
    })
  },
  { 
    key: 'feature_flags', 
    value: JSON.stringify({
      email_verification: true,
      two_factor_auth: false,
      social_login: true,
      password_policy: true
    })
  },
  { 
    key: 'ui_theme', 
    value: JSON.stringify({
      primary_color: '#007bff',
      secondary_color: '#6c757d',
      dark_mode: false,
      logo_url: '/assets/logo.png'
    })
  }
];