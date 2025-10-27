/**
 * Mock data for Conversations and Messages
 * Used for database seeding
 */

export const mockConversations = [
  {
    title: 'Project Planning Discussion',
    description: 'Discussing the roadmap for Q1 2024',
    status: 'active',
    metadata: {
      tags: ['planning', 'roadmap'],
      priority: 'high',
    },
  },
  {
    title: 'Technical Architecture Review',
    description: 'Reviewing the system architecture',
    status: 'active',
    metadata: {
      tags: ['architecture', 'technical'],
      priority: 'medium',
    },
  },
  {
    title: 'Code Debugging Session',
    description: 'Debugging production issues',
    status: 'archived',
    metadata: {
      tags: ['debugging', 'support'],
      priority: 'urgent',
    },
  },
];

export const mockMessages = [
  {
    content: 'Hello! I need help with planning our Q1 roadmap.',
    role: 'user',
    metadata: {
      timestamp: new Date().toISOString(),
    },
  },
  {
    content: 'I\'d be happy to help! Let\'s start by identifying your key objectives for Q1.',
    role: 'assistant',
    metadata: {
      timestamp: new Date().toISOString(),
    },
  },
  {
    content: 'Our main goals are to improve performance and add new features.',
    role: 'user',
    metadata: {
      timestamp: new Date().toISOString(),
    },
  },
];
