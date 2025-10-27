/**
 * AI Platform Mock Data
 * 
 * Mock data for AI platforms used in database seeding.
 */

export const mockAIPlatforms = [
  {
    id: 'openai-platform',
    name: 'OpenAI',
    description: 'OpenAI Platform for GPT models',
    apiEndpoint: 'https://api.openai.com/v1',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'anthropic-platform',
    name: 'Anthropic',
    description: 'Anthropic Platform for Claude models',
    apiEndpoint: 'https://api.anthropic.com/v1',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'google-platform',
    name: 'Google AI',
    description: 'Google AI Platform for Gemini models',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];
