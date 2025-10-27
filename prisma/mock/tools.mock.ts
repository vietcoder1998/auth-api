/**
 * Mock data for Tools
 * Used for database seeding
 */

export const mockTools = [
  {
    name: 'Web Search',
    description: 'Search the web for information',
    type: 'search',
    config: {
      enabled: true,
      searchEngine: 'google',
    },
  },
  {
    name: 'Calculator',
    description: 'Perform mathematical calculations',
    type: 'calculation',
    config: {
      enabled: true,
      precision: 10,
    },
  },
  {
    name: 'Code Executor',
    description: 'Execute code snippets safely',
    type: 'execution',
    config: {
      enabled: true,
      languages: ['javascript', 'python', 'typescript'],
      timeout: 5000,
    },
  },
  {
    name: 'Image Generator',
    description: 'Generate images using AI',
    type: 'generation',
    config: {
      enabled: true,
      provider: 'dall-e',
    },
  },
  {
    name: 'File Reader',
    description: 'Read and analyze files',
    type: 'file',
    config: {
      enabled: true,
      maxSize: 10485760, // 10MB
      allowedExtensions: ['.txt', '.pdf', '.docx'],
    },
  },
];
