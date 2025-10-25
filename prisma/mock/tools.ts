// Mock tools for seeding
export const mockTools = [
  {
    name: 'Web Search',
    description: 'Search the web for information',
    type: 'api',
    config: JSON.stringify({ provider: 'Google', lang: 'en' }),
    enabled: true,
  },
  {
    name: 'Calculator',
    description: 'Perform basic arithmetic operations',
    type: 'function',
    config: JSON.stringify({ precision: 2 }),
    enabled: true,
  },
  {
    name: 'Email Sender',
    description: 'Send emails to users',
    type: 'plugin',
    config: JSON.stringify({ smtp: 'smtp.example.com' }),
    enabled: false,
  },
];
