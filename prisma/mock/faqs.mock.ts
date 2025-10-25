/**
 * Mock data for FAQs
 * Used for database seeding
 */

export const mockFAQs = [
  {
    question: 'How do I reset my password?',
    answer: 'You can reset your password by clicking on the "Forgot Password" link on the login page. Follow the instructions sent to your email.',
    category: 'Account',
    order: 1,
    isPublished: true,
    metadata: {
      tags: ['password', 'account', 'security'],
      views: 150,
    },
  },
  {
    question: 'How do I create a new agent?',
    answer: 'Navigate to the Agents section and click "Create New Agent". Fill in the required details including name, description, and select an AI model.',
    category: 'Agents',
    order: 2,
    isPublished: true,
    metadata: {
      tags: ['agent', 'creation', 'setup'],
      views: 85,
    },
  },
  {
    question: 'What AI models are supported?',
    answer: 'We support GPT-4, GPT-3.5-Turbo, Claude-3-Opus, Claude-3-Sonnet, and Gemini-Pro. More models are being added regularly.',
    category: 'AI Models',
    order: 3,
    isPublished: true,
    metadata: {
      tags: ['ai', 'models', 'features'],
      views: 200,
    },
  },
  {
    question: 'How do I upgrade my subscription?',
    answer: 'Go to Settings > Billing and select your desired plan. You\'ll be redirected to the payment page to complete the upgrade.',
    category: 'Billing',
    order: 4,
    isPublished: true,
    metadata: {
      tags: ['billing', 'subscription', 'upgrade'],
      views: 120,
    },
  },
  {
    question: 'Can I export my conversation history?',
    answer: 'Yes! Go to Conversations, select the conversations you want to export, and click "Export". You can choose between JSON, CSV, or PDF formats.',
    category: 'Data',
    order: 5,
    isPublished: true,
    metadata: {
      tags: ['export', 'data', 'conversations'],
      views: 90,
    },
  },
  {
    question: 'What are the API rate limits?',
    answer: 'API rate limits vary by plan: Free (100 requests/hour), Pro (1000 requests/hour), Enterprise (unlimited). Check your dashboard for current usage.',
    category: 'API',
    order: 6,
    isPublished: false,
    metadata: {
      tags: ['api', 'limits', 'rate'],
      views: 45,
    },
  },
];
