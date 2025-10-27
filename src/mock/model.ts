// Mock AI models for seeding
export const mockModels = [
  {
    id: 'model-1',
    name: 'GPT-4',
    description: 'OpenAI GPT-4 model',
    type: 'gpt',
    platformId: 'platform-1', // OpenAI
  },
  {
    id: 'model-2',
    name: 'Claude-3',
    description: 'Anthropic Claude-3 model',
    type: 'claude',
    platformId: 'platform-2', // Anthropic
  },
  {
    id: 'model-3',
    name: 'Gemini-Pro',
    description: 'Google Gemini Pro model',
    type: 'gemini',
    platformId: null, // No Google platform in mockAIPlatforms yet
  },
];