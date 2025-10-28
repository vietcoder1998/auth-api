// Mock data for AI agents
export const mockAgents = [
  {
    id: 'agent-001',
    name: 'General Assistant',
    description:
      'A versatile AI assistant capable of helping with various tasks including answering questions, providing explanations, and offering guidance on a wide range of topics.',
    model: 'gpt-4',
    personality: JSON.stringify({
      traits: ['helpful', 'friendly', 'knowledgeable', 'patient'],
      tone: 'professional',
      responseStyle: 'detailed',
    }),
    systemPrompt:
      'You are a helpful AI assistant. Provide accurate, helpful, and friendly responses to user queries. Always strive to be clear and concise while being comprehensive.',
    config: JSON.stringify({
      temperature: 0.7,
      max_tokens: 2000,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    }),
    isActive: true,
    ownerId: 'super-admin-id',
  },
  {
    id: 'agent-002',
    name: 'Code Assistant',
    description:
      'Specialized AI assistant for programming and software development. Helps with code review, debugging, architecture decisions, and best practices.',
    model: 'gpt-4',
    personality: JSON.stringify({
      traits: ['analytical', 'precise', 'methodical', 'detail-oriented'],
      tone: 'technical',
      responseStyle: 'structured',
    }),
    systemPrompt:
      'You are an expert software developer and architect. Help users with coding problems, review code for best practices, suggest improvements, and explain complex technical concepts clearly.',
    config: JSON.stringify({
      temperature: 0.3,
      max_tokens: 4000,
      presence_penalty: 0.0,
      frequency_penalty: 0.0,
    }),
    isActive: true,
    ownerId: 'super-admin-id',
  },
  {
    id: 'agent-003',
    name: 'Business Analyst',
    description:
      'AI assistant focused on business analysis, strategy, and decision-making. Provides insights on market trends, business processes, and strategic planning.',
    model: 'gpt-4',
    personality: JSON.stringify({
      traits: ['strategic', 'analytical', 'results-oriented', 'insightful'],
      tone: 'business-formal',
      responseStyle: 'executive-summary',
    }),
    systemPrompt:
      'You are a senior business analyst and strategist. Help users analyze business problems, identify opportunities, create strategic plans, and make data-driven decisions.',
    config: JSON.stringify({
      temperature: 0.4,
      max_tokens: 3000,
      presence_penalty: 0.2,
      frequency_penalty: 0.1,
    }),
    isActive: true,
    ownerId: 'admin-id',
  },
  {
    id: 'agent-004',
    name: 'Creative Writer',
    description:
      'AI assistant specialized in creative writing, storytelling, and content creation. Helps with writing projects, brainstorming ideas, and improving narrative structure.',
    model: 'gpt-4',
    personality: JSON.stringify({
      traits: ['creative', 'imaginative', 'expressive', 'inspiring'],
      tone: 'creative',
      responseStyle: 'narrative',
    }),
    systemPrompt:
      'You are a creative writing expert and storyteller. Help users develop their writing skills, create compelling narratives, brainstorm creative ideas, and improve their storytelling techniques.',
    config: JSON.stringify({
      temperature: 0.9,
      max_tokens: 3500,
      presence_penalty: 0.3,
      frequency_penalty: 0.2,
    }),
    isActive: false,
    ownerId: 'admin-id',
  },
  {
    id: 'agent-005',
    name: 'Learning Companion',
    description:
      'Educational AI assistant that helps with learning and skill development. Provides explanations, creates study materials, and guides users through learning processes.',
    model: 'gpt-4',
    personality: JSON.stringify({
      traits: ['patient', 'encouraging', 'educational', 'supportive'],
      tone: 'educational',
      responseStyle: 'step-by-step',
    }),
    systemPrompt:
      'You are an educational mentor and learning companion. Help users learn new concepts, break down complex topics into understandable parts, and provide encouragement throughout their learning journey.',
    config: JSON.stringify({
      temperature: 0.6,
      max_tokens: 2500,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    }),
    isActive: true,
    ownerId: 'user-id',
  },
  {
    id: 'agent-006',
    name: 'Permission Manager Agent',
    description:
      'AI assistant specialized in managing permissions and access control. Handles CRUD operations for permissions, roles, and access management.',
    model: 'gpt-4',
    personality: JSON.stringify({
      traits: ['precise', 'security-focused', 'methodical', 'reliable'],
      tone: 'professional',
      responseStyle: 'structured',
    }),
    systemPrompt:
      'You are a security and permission management expert. Help users manage permissions, roles, and access control. Always prioritize security and follow the principle of least privilege. Provide clear explanations of permission changes and their implications.',
    config: JSON.stringify({
      temperature: 0.2,
      max_tokens: 2000,
      presence_penalty: 0.0,
      frequency_penalty: 0.0,
    }),
    isActive: true,
    ownerId: 'super-admin-id',
  },
];

// Mock data for agent memories
export const mockAgentMemories = [
  {
    agentId: 'agent-001',
    type: 'knowledge_base',
    content:
      'User prefers detailed explanations with examples. Previously asked about project management methodologies.',
    importance: 7,
    metadata: JSON.stringify({
      tags: ['user-preference', 'project-management'],
      source: 'conversation-history',
    }),
  },
  {
    agentId: 'agent-002',
    type: 'knowledge_base',
    content:
      'User is working with React and TypeScript. Prefers functional components and modern hooks patterns.',
    importance: 8,
    metadata: JSON.stringify({ tags: ['react', 'typescript', 'hooks'], source: 'code-review' }),
  },
  {
    agentId: 'agent-003',
    type: 'long_term',
    content:
      "User's company is in the fintech sector, focusing on digital banking solutions. Key metrics: user acquisition and retention.",
    importance: 9,
    metadata: JSON.stringify({
      tags: ['fintech', 'banking', 'metrics'],
      source: 'business-analysis',
    }),
  },
  {
    agentId: 'agent-006',
    type: 'knowledge_base',
    content:
      'Permission system follows role-based access control (RBAC). Common categories: user, admin, system, api. Follows principle of least privilege.',
    importance: 9,
    metadata: JSON.stringify({
      tags: ['permissions', 'rbac', 'security', 'access-control'],
      source: 'system-knowledge',
    }),
  },
  {
    agentId: 'agent-006',
    type: 'long_term',
    content:
      'Recent permission changes: Created user.read, user.write, admin.manage. Deleted deprecated legacy.access permission.',
    importance: 7,
    metadata: JSON.stringify({
      tags: ['audit', 'permission-changes', 'history'],
      source: 'permission-audit-log',
    }),
  },
];

// Mock data for agent tools
export const mockAgentTools = [
  {
    agentId: 'agent-001',
    name: 'web_search',
    type: 'api',
    config: JSON.stringify({ provider: 'google', max_results: 10 }),
    enabled: true,
  },
  {
    agentId: 'agent-002',
    name: 'code_analyzer',
    type: 'function',
    config: JSON.stringify({ supported_languages: ['javascript', 'typescript', 'python', 'java'] }),
    enabled: true,
  },
  {
    agentId: 'agent-003',
    name: 'market_data',
    type: 'api',
    config: JSON.stringify({
      provider: 'bloomberg',
      data_types: ['stocks', 'forex', 'commodities'],
    }),
    enabled: true,
  },
  {
    agentId: 'agent-006',
    name: 'Permission Manager', // Must match the tool name in mockTools
    type: 'api',
    config: JSON.stringify({
      baseUrl: '/api/permission',
      supportedOperations: ['create', 'read', 'update', 'delete', 'search'],
      capabilities: ['CRUD', 'search_by_name', 'search_by_category', 'search_by_method'],
    }),
    enabled: true,
  },
];

// Mock data for agent tasks
export const mockAgentTasks = [
  {
    agentId: 'agent-001',
    name: 'Daily Summary Report',
    input: JSON.stringify({ date: '2024-01-15', topics: ['technology', 'business', 'science'] }),
    output: JSON.stringify({
      summary:
        'Generated comprehensive daily summary covering key developments in technology, business, and science sectors.',
      word_count: 1250,
    }),
    status: 'completed',
    startedAt: new Date('2024-01-15T09:00:00Z'),
  },
  {
    agentId: 'agent-002',
    name: 'Code Quality Analysis',
    input: JSON.stringify({ repository: 'user/project', branch: 'main', files: ['src/**/*.ts'] }),
    output: null,
    status: 'running',
    startedAt: new Date('2024-01-15T10:30:00Z'),
  },
  {
    agentId: 'agent-003',
    name: 'Market Research Report',
    input: JSON.stringify({ sector: 'fintech', region: 'north-america', timeframe: 'Q4-2023' }),
    output: null,
    status: 'pending',
    startedAt: null,
  },
  {
    agentId: 'agent-005',
    name: 'Learning Path Generation',
    input: JSON.stringify({
      topic: 'machine-learning',
      skill_level: 'beginner',
      duration: '3-months',
    }),
    output: JSON.stringify({
      path: 'Created structured 3-month ML learning path with 12 modules',
      resources: 45,
    }),
    status: 'completed',
    startedAt: new Date('2024-01-14T14:00:00Z'),
  },
  {
    agentId: 'agent-004',
    name: 'Content Creation Campaign',
    input: JSON.stringify({
      theme: 'sustainability',
      content_types: ['blog', 'social'],
      quantity: 10,
    }),
    output: null,
    status: 'failed',
    error: 'API rate limit exceeded',
    startedAt: new Date('2024-01-15T08:00:00Z'),
  },
  {
    agentId: 'agent-006',
    name: 'CREATE_PERMISSION',
    input: JSON.stringify({
      command: 'CREATE_PERMISSION',
      params: {
        name: 'user.profile.read',
        description: 'Allow users to read their own profile information',
        category: 'user',
        route: '/api/users/profile',
        method: 'GET',
      },
    }),
    output: JSON.stringify({
      success: true,
      permission: {
        id: 'perm-001',
        name: 'user.profile.read',
        category: 'user',
        created: true,
      },
    }),
    status: 'completed',
    startedAt: new Date('2024-01-15T09:00:00Z'),
  },
  {
    agentId: 'agent-006',
    name: 'LIST_PERMISSIONS',
    input: JSON.stringify({
      command: 'LIST_PERMISSIONS',
      params: {
        category: 'user',
        method: 'GET',
      },
    }),
    output: JSON.stringify({
      success: true,
      permissions: [
        { name: 'user.profile.read', category: 'user', method: 'GET' },
        { name: 'user.profile.update', category: 'user', method: 'PUT' },
        { name: 'user.settings.read', category: 'user', method: 'GET' },
      ],
      total: 3,
    }),
    status: 'completed',
    startedAt: new Date('2024-01-15T09:30:00Z'),
  },
  {
    agentId: 'agent-006',
    name: 'UPDATE_PERMISSION',
    input: JSON.stringify({
      command: 'UPDATE_PERMISSION',
      params: {
        id: 'perm-001',
        description: 'Allow users to read and view their profile information and settings',
        category: 'user',
      },
    }),
    output: JSON.stringify({
      success: true,
      updated: true,
      permission: {
        id: 'perm-001',
        name: 'user.profile.read',
        description: 'Allow users to read and view their profile information and settings',
      },
    }),
    status: 'completed',
    startedAt: new Date('2024-01-15T10:00:00Z'),
  },
  {
    agentId: 'agent-006',
    name: 'GET_PERMISSION',
    input: JSON.stringify({
      command: 'GET_PERMISSION',
      params: {
        id: 'perm-001',
      },
    }),
    output: JSON.stringify({
      success: true,
      permission: {
        id: 'perm-001',
        name: 'user.profile.read',
        description: 'Allow users to read and view their profile information and settings',
        category: 'user',
        route: '/api/users/profile',
        method: 'GET',
      },
    }),
    status: 'completed',
    startedAt: new Date('2024-01-15T10:30:00Z'),
  },
  {
    agentId: 'agent-006',
    name: 'FIND_PERMISSION_BY_NAME',
    input: JSON.stringify({
      command: 'FIND_PERMISSION_BY_NAME',
      params: {
        name: 'user.profile.read',
      },
    }),
    output: JSON.stringify({
      success: true,
      permission: {
        id: 'perm-001',
        name: 'user.profile.read',
        description: 'Allow users to read and view their profile information and settings',
        category: 'user',
      },
    }),
    status: 'completed',
    startedAt: new Date('2024-01-15T11:00:00Z'),
  },
  {
    agentId: 'agent-006',
    name: 'FIND_PERMISSIONS_BY_CATEGORY',
    input: JSON.stringify({
      command: 'FIND_PERMISSIONS_BY_CATEGORY',
      params: {
        category: 'admin',
      },
    }),
    output: JSON.stringify({
      success: true,
      permissions: [
        { name: 'admin.users.manage', category: 'admin', method: 'POST' },
        { name: 'admin.roles.manage', category: 'admin', method: 'PUT' },
      ],
      total: 2,
    }),
    status: 'completed',
    startedAt: new Date('2024-01-15T11:30:00Z'),
  },
  {
    agentId: 'agent-006',
    name: 'FIND_PERMISSIONS_BY_METHOD',
    input: JSON.stringify({
      command: 'FIND_PERMISSIONS_BY_METHOD',
      params: {
        method: 'POST',
      },
    }),
    output: JSON.stringify({
      success: true,
      permissions: [
        { name: 'user.create', category: 'user', method: 'POST' },
        { name: 'admin.users.manage', category: 'admin', method: 'POST' },
      ],
      total: 2,
    }),
    status: 'completed',
    startedAt: new Date('2024-01-15T12:00:00Z'),
  },
  {
    agentId: 'agent-006',
    name: 'DELETE_PERMISSION',
    input: JSON.stringify({
      command: 'DELETE_PERMISSION',
      params: {
        id: 'perm-legacy-001',
      },
    }),
    output: JSON.stringify({
      success: true,
      deleted: true,
      message: 'Permission perm-legacy-001 has been permanently deleted',
    }),
    status: 'completed',
    startedAt: new Date('2024-01-15T12:30:00Z'),
  },
];
