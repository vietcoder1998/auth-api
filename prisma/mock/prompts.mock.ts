/**
 * Mock data for Prompts
 * Used for database seeding
 */

export const mockPrompts = [
  {
    name: 'Code Review Assistant',
    description: 'Helps review code and suggest improvements',
    content: 'You are an expert code reviewer. Analyze the following code and provide constructive feedback on:\n1. Code quality and best practices\n2. Potential bugs or issues\n3. Performance optimizations\n4. Security concerns\n\nCode to review:\n{{code}}',
    category: 'Development',
    isPublic: true,
    metadata: {
      tags: ['code', 'review', 'development'],
      usageCount: 150,
      rating: 4.8,
    },
  },
  {
    name: 'SQL Query Generator',
    description: 'Generates SQL queries from natural language',
    content: 'You are a SQL expert. Generate a SQL query based on the following requirements:\n\nDatabase schema: {{schema}}\nRequirement: {{requirement}}\n\nProvide:\n1. The SQL query\n2. Explanation of the query\n3. Any potential performance considerations',
    category: 'Database',
    isPublic: true,
    metadata: {
      tags: ['sql', 'database', 'query'],
      usageCount: 200,
      rating: 4.9,
    },
  },
  {
    name: 'Email Composer',
    description: 'Drafts professional emails',
    content: 'Draft a professional email with the following details:\n\nRecipient: {{recipient}}\nPurpose: {{purpose}}\nKey points: {{keyPoints}}\nTone: {{tone}}\n\nEnsure the email is:\n- Professional and courteous\n- Clear and concise\n- Action-oriented',
    category: 'Communication',
    isPublic: true,
    metadata: {
      tags: ['email', 'communication', 'professional'],
      usageCount: 300,
      rating: 4.7,
    },
  },
  {
    name: 'Bug Report Analyzer',
    description: 'Analyzes bug reports and suggests solutions',
    content: 'Analyze this bug report and provide:\n\nBug Report:\n{{bugReport}}\n\nProvide:\n1. Root cause analysis\n2. Suggested fix\n3. Steps to reproduce\n4. Prevention strategies',
    category: 'Development',
    isPublic: true,
    metadata: {
      tags: ['bug', 'debugging', 'analysis'],
      usageCount: 175,
      rating: 4.6,
    },
  },
  {
    name: 'Meeting Notes Summarizer',
    description: 'Summarizes meeting notes into action items',
    content: 'Summarize the following meeting notes:\n\n{{meetingNotes}}\n\nProvide:\n1. Key discussion points\n2. Action items with owners\n3. Decisions made\n4. Next steps',
    category: 'Productivity',
    isPublic: true,
    metadata: {
      tags: ['meeting', 'summary', 'productivity'],
      usageCount: 250,
      rating: 4.8,
    },
  },
  {
    name: 'Internal API Documentation',
    description: 'Private prompt for API documentation',
    content: 'Generate API documentation for:\n\nEndpoint: {{endpoint}}\nMethod: {{method}}\nParameters: {{parameters}}\n\nInclude request/response examples.',
    category: 'Development',
    isPublic: false,
    metadata: {
      tags: ['api', 'documentation', 'internal'],
      usageCount: 50,
      rating: 4.5,
    },
  },
];
