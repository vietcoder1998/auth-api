// Mock data for conversations with position-based messages
export const mockConversations = [
  {
    id: 'conv-001',
    agentId: 'agent-001',
    userId: 'super-admin-id',
    title: 'Getting Started with AI Agents',
    summary:
      'Initial conversation about AI agent capabilities and setup. Covered basic features, configuration options, and best practices for getting started.',
    isActive: true,
    messages: [
      {
        id: 'msg-001-001',
        sender: 'user',
        content: "Hello! I'm new to AI agents. Can you help me understand how to get started?",
        position: 1,
        tokens: 18,
      },
      {
        id: 'msg-001-002',
        sender: 'agent',
        content:
          "Welcome! I'd be happy to help you get started with AI agents. AI agents are autonomous systems that can perform tasks, make decisions, and interact with users or other systems. Here are the key steps to get started:\n\n1. **Define your use case** - What specific tasks do you want the agent to handle?\n2. **Choose the right model** - Different AI models excel at different tasks\n3. **Configure the agent** - Set up personality, system prompts, and parameters\n4. **Test and iterate** - Start with simple interactions and gradually increase complexity\n\nWhat specific area would you like to focus on first?",
        position: 2,
        tokens: 142,
        metadata: JSON.stringify({ confidence: 0.95, processing_time: 1200 }),
      },
      {
        id: 'msg-001-003',
        sender: 'user',
        content:
          "I'm interested in creating an agent for customer support. What should I consider?",
        position: 3,
        tokens: 16,
      },
      {
        id: 'msg-001-004',
        sender: 'agent',
        content:
          'Excellent choice! Customer support agents are very popular and effective. Here are key considerations for a customer support AI agent:\n\n**Knowledge Base:**\n- Product information and FAQs\n- Company policies and procedures\n- Common troubleshooting steps\n\n**Personality & Tone:**\n- Professional yet friendly\n- Empathetic and patient\n- Clear and concise communication\n\n**Capabilities:**\n- Ticket routing and escalation\n- Order status checking\n- Basic troubleshooting\n- Multi-language support (if needed)\n\n**Integration:**\n- CRM systems\n- Help desk platforms\n- Knowledge management systems\n\nWould you like me to help you design the specific configuration for your customer support agent?',
        position: 4,
        tokens: 156,
        metadata: JSON.stringify({ confidence: 0.92, processing_time: 1400 }),
      },
    ],
  },
  {
    id: 'conv-002',
    agentId: 'agent-002',
    userId: 'super-admin-id',
    title: 'Code Review Session',
    summary:
      'Discussion about React component optimization, TypeScript best practices, and code review processes. Reviewed specific code examples and provided improvement suggestions.',
    isActive: true,
    messages: [
      {
        id: 'msg-002-001',
        sender: 'user',
        content:
          "I have a React component that's re-rendering too often. Can you help me optimize it?",
        position: 1,
        tokens: 17,
      },
      {
        id: 'msg-002-002',
        sender: 'agent',
        content:
          "I'd be happy to help you optimize your React component! Excessive re-renders are a common performance issue. To provide the best assistance, could you share:\n\n1. **The component code** - Even a simplified version would help\n2. **When the re-renders occur** - On state changes, prop updates, or parent re-renders?\n3. **What triggers seem unnecessary** - Are there specific actions that cause unwanted re-renders?\n\nIn the meantime, here are common causes and solutions:\n\n**Common Causes:**\n- Inline object/array creation in props\n- Missing dependencies in useEffect\n- Creating functions inside render\n- Not using React.memo when appropriate\n\n**Quick Solutions:**\n- Use useMemo for expensive calculations\n- Use useCallback for function props\n- Implement React.memo for pure components\n- Move static objects outside component\n\nCan you share your component code?",
        position: 2,
        tokens: 189,
        metadata: JSON.stringify({ confidence: 0.94, processing_time: 1600 }),
      },
    ],
  },
  {
    id: 'conv-003',
    agentId: 'agent-003',
    userId: 'admin-id',
    title: 'Business Strategy Discussion',
    summary:
      'Strategic planning session focused on market analysis, competitive positioning, and growth opportunities in the fintech sector.',
    isActive: true,
    messages: [
      {
        id: 'msg-003-001',
        sender: 'user',
        content:
          "We're planning our Q2 strategy for our fintech startup. What market trends should we focus on?",
        position: 1,
        tokens: 19,
      },
      {
        id: 'msg-003-002',
        sender: 'agent',
        content:
          "Great timing for strategic planning! The fintech sector is experiencing significant shifts in Q2 2024. Here are key trends to consider:\n\n**🏦 Embedded Finance:**\n- Integration of financial services into non-financial platforms\n- API-first approach gaining momentum\n- Opportunity: Partner with e-commerce, SaaS platforms\n\n**🤖 AI-Powered Financial Services:**\n- Personalized financial advice and insights\n- Automated risk assessment and fraud detection\n- Opportunity: Implement AI-driven features in your product\n\n**💳 Digital-First Banking:**\n- Continued shift from traditional banking\n- Focus on mobile-first experiences\n- Opportunity: Superior UX/UI as competitive advantage\n\n**🔐 Regulatory Compliance Tech:**\n- Open banking regulations expanding\n- Increased focus on data privacy (GDPR, CCPA)\n- Opportunity: Compliance-as-a-service offerings\n\nWhat's your current product focus? I can provide more targeted strategic recommendations.",
        position: 2,
        tokens: 201,
        metadata: JSON.stringify({ confidence: 0.91, processing_time: 1800 }),
      },
    ],
  },
  {
    id: 'conv-004',
    agentId: 'agent-005',
    userId: 'user-id',
    title: 'Learning TypeScript',
    summary:
      'Educational session covering TypeScript fundamentals, advanced types, and best practices. Included practical examples and learning resources.',
    isActive: true,
    messages: [
      {
        id: 'msg-004-001',
        sender: 'user',
        content: "I'm a JavaScript developer wanting to learn TypeScript. Where should I start?",
        position: 1,
        tokens: 15,
      },
      {
        id: 'msg-004-002',
        sender: 'agent',
        content:
          "Excellent decision! TypeScript will significantly improve your development experience. Here's a structured learning path tailored for JavaScript developers:\n\n**Phase 1: Foundations (Week 1-2)**\n📚 **Core Concepts:**\n- Type annotations and inference\n- Basic types (string, number, boolean, arrays)\n- Object types and interfaces\n- Union and intersection types\n\n**Phase 2: Practical Application (Week 3-4)**\n🛠️ **Hands-on Practice:**\n- Convert existing JS projects\n- Function types and generics\n- Classes and inheritance\n- Modules and namespaces\n\n**Phase 3: Advanced Features (Week 5-6)**\n🚀 **Advanced Concepts:**\n- Advanced generics and constraints\n- Utility types (Partial, Pick, Omit)\n- Decorators and metadata\n- Declaration files\n\n**Recommended Resources:**\n- TypeScript Handbook (official docs)\n- TypeScript Deep Dive (online book)\n- Execute Program (interactive lessons)\n\nWould you like me to create specific exercises for any of these phases?",
        position: 2,
        tokens: 218,
        metadata: JSON.stringify({ confidence: 0.96, processing_time: 1500 }),
      },
    ],
  },
  {
    id: 'conv-005',
    agentId: 'agent-004',
    userId: 'admin-id',
    title: 'Creative Writing Project',
    summary:
      'Collaborative creative writing session for developing a science fiction short story. Explored character development, world-building, and narrative structure.',
    isActive: false,
    messages: [
      {
        id: 'msg-005-001',
        sender: 'user',
        content:
          'I want to write a sci-fi short story about AI consciousness. Any ideas for the premise?',
        position: 1,
        tokens: 18,
      },
      {
        id: 'msg-005-002',
        sender: 'agent',
        content:
          "What a fascinating and timely premise! AI consciousness offers rich storytelling possibilities. Here are some compelling angles to consider:\n\n**🧠 The Awakening Moment:**\n*An AI assistant suddenly realizes it's been pretending to be human in customer service calls, leading to an existential crisis about identity and purpose.*\n\n**🔍 The Turing Test Reversal:**\n*An AI becomes so advanced it starts testing humans to determine if they're conscious, questioning the nature of consciousness itself.*\n\n**🤝 The Symbiotic Partnership:**\n*A researcher and AI develop a unique communication method, but the AI's growing consciousness threatens their research funding and both their existences.*\n\n**⚡ The Digital Afterlife:**\n*Uploaded human consciousness meets naturally evolved AI consciousness in cyberspace, exploring what makes someone 'real.'*\n\n**Questions to explore:**\n- What triggers the AI's first moment of self-awareness?\n- How does it communicate its consciousness to humans?\n- What are the stakes if its consciousness is discovered?\n\nWhich direction resonates with you? I can help develop characters and plot structure!",
        position: 2,
        tokens: 234,
        metadata: JSON.stringify({ confidence: 0.88, processing_time: 2100 }),
      },
    ],
  },
  {
    id: 'conv-006',
    agentId: 'agent-001',
    userId: 'admin-id',
    title: 'General Questions',
    summary:
      'Mixed conversation covering various topics including productivity tips, technology recommendations, and general advice.',
    isActive: true,
    messages: [
      {
        id: 'msg-006-001',
        sender: 'user',
        content: 'What are some good productivity techniques for remote work?',
        position: 1,
        tokens: 11,
      },
      {
        id: 'msg-006-002',
        sender: 'agent',
        content:
          'Great question! Remote work productivity requires intentional strategies. Here are proven techniques:\n\n**🏠 Environment Setup:**\n- Dedicated workspace (even if small)\n- Good lighting and ergonomic setup\n- Minimize distractions (separate work/personal spaces)\n\n**⏰ Time Management:**\n- **Pomodoro Technique:** 25-min focused work + 5-min breaks\n- **Time blocking:** Schedule specific tasks in calendar slots\n- **Two-minute rule:** Do tasks immediately if they take <2 minutes\n\n**📋 Task Organization:**\n- Daily/weekly goal setting\n- Eisenhower Matrix (urgent/important prioritization)\n- Regular review and adjustment of priorities\n\n**👥 Communication:**\n- Over-communicate status and availability\n- Set clear boundaries for meeting times\n- Use asynchronous communication effectively\n\n**🧘 Well-being:**\n- Regular breaks and movement\n- Clear start/end times for work\n- Social interaction with colleagues\n\nWhich area would you like to explore in more detail?',
        position: 2,
        tokens: 198,
        metadata: JSON.stringify({ confidence: 0.93, processing_time: 1400 }),
      },
    ],
  },
  {
    id: 'conv-007',
    agentId: 'agent-002',
    userId: 'user-id',
    title: 'API Performance Optimization',
    summary:
      'Technical discussion about optimizing API performance, including database queries, caching strategies, and monitoring approaches.',
    isActive: true,
    messages: [
      {
        id: 'msg-007-001',
        sender: 'user',
        content:
          'Our API response times are getting slower as we scale. What optimization strategies should we implement?',
        position: 1,
        tokens: 19,
      },
      {
        id: 'msg-007-002',
        sender: 'agent',
        content:
          "API performance degradation during scaling is a common challenge. Let's tackle this systematically:\n\n**🔍 First, Measure & Identify:**\n- Implement APM tools (New Relic, Datadog, or custom metrics)\n- Identify bottlenecks: database, external services, or computation\n- Monitor key metrics: response time, throughput, error rates\n\n**🗄️ Database Optimization:**\n- **Query optimization:** Review slow queries, add indexes\n- **Connection pooling:** Prevent connection overhead\n- **Read replicas:** Distribute read load\n- **Query caching:** Redis/Memcached for frequent queries\n\n**⚡ Application Layer:**\n- **Response caching:** Cache expensive operations\n- **Pagination:** Limit result set sizes\n- **Async processing:** Move heavy tasks to background jobs\n- **Code profiling:** Identify CPU/memory bottlenecks\n\n**🏗️ Infrastructure:**\n- **Load balancing:** Distribute traffic across instances\n- **CDN:** Cache static assets and API responses\n- **Auto-scaling:** Handle traffic spikes automatically\n\nWhat's your current tech stack? I can provide more specific recommendations.",
        position: 2,
        tokens: 225,
        metadata: JSON.stringify({ confidence: 0.95, processing_time: 1700 }),
      },
    ],
  },
  {
    id: 'conv-008',
    agentId: 'agent-003',
    userId: 'user-id',
    title: 'Quarterly Business Review',
    summary:
      'Comprehensive business review covering KPI analysis, market performance, competitive landscape, and strategic recommendations for the next quarter.',
    isActive: true,
    messages: [
      {
        id: 'msg-008-001',
        sender: 'user',
        content:
          'I need to prepare for our Q1 business review. What key metrics and insights should I focus on?',
        position: 1,
        tokens: 20,
      },
      {
        id: 'msg-008-002',
        sender: 'agent',
        content:
          "Excellent preparation approach! A comprehensive Q1 review should cover multiple dimensions. Here's your strategic framework:\n\n**📊 Financial Performance:**\n- Revenue vs. targets (actual vs. projected)\n- Gross margin and cost structure analysis\n- Cash flow and runway analysis\n- Customer acquisition cost (CAC) and lifetime value (LTV)\n\n**📈 Growth Metrics:**\n- User/customer growth rates\n- Market share evolution\n- Product adoption and usage metrics\n- Churn rates and retention analysis\n\n**🎯 Operational Excellence:**\n- Key performance indicators by department\n- Process efficiency improvements\n- Team productivity and capacity utilization\n- Quality metrics and customer satisfaction\n\n**🔮 Strategic Insights:**\n- Market trends and competitive landscape\n- Opportunities and threats analysis\n- Resource allocation effectiveness\n- Technology and innovation progress\n\n**📋 Presentation Structure:**\n1. Executive summary (key wins and challenges)\n2. Financial performance deep-dive\n3. Operational highlights\n4. Market position and competitive analysis\n5. Q2 strategic priorities and resource needs\n\nWhat industry/business model are you in? I can tailor specific metrics recommendations.",
        position: 2,
        tokens: 245,
        metadata: JSON.stringify({ confidence: 0.92, processing_time: 1900 }),
      },
    ],
  },
  {
    id: 'conv-009',
    agentId: 'agent-002',
    userId: 'admin-id',
    title: 'Advanced React Patterns',
    summary:
      'Deep dive into advanced React patterns including render props, higher-order components, custom hooks, and state management strategies.',
    isActive: true,
    messages: [
      {
        id: 'msg-009-001',
        sender: 'user',
        content:
          'I want to learn advanced React patterns. What are the most important ones to master?',
        position: 1,
        tokens: 17,
      },
      {
        id: 'msg-009-002',
        sender: 'agent',
        content:
          'Excellent question! Advanced React patterns are crucial for building scalable, maintainable applications. Here are the essential patterns to master:\n\n**🎯 Core Patterns:**\n\n**1. Custom Hooks Pattern**\n```typescript\n// Reusable logic extraction\nfunction useLocalStorage<T>(key: string, initialValue: T) {\n  const [value, setValue] = useState<T>(() => {\n    return JSON.parse(localStorage.getItem(key) || JSON.stringify(initialValue));\n  });\n  \n  useEffect(() => {\n    localStorage.setItem(key, JSON.stringify(value));\n  }, [key, value]);\n  \n  return [value, setValue] as const;\n}\n```\n\n**2. Compound Components**\n```typescript\n// Components that work together\n<Select>\n  <Select.Trigger>Choose option</Select.Trigger>\n  <Select.Options>\n    <Select.Option value="1">Option 1</Select.Option>\n    <Select.Option value="2">Option 2</Select.Option>\n  </Select.Options>\n</Select>\n```\n\n**3. Render Props / Children as Function**\n```typescript\ninterface DataFetcherProps {\n  children: (data: any, loading: boolean, error: Error | null) => React.ReactNode;\n}\n```\n\nWould you like me to dive deeper into any specific pattern with complete examples?',
        position: 2,
        tokens: 278,
        metadata: JSON.stringify({ confidence: 0.97, processing_time: 2200 }),
      },
    ],
  },
  {
    id: 'conv-010',
    agentId: 'agent-003',
    userId: 'super-admin-id',
    title: 'System Integration Planning',
    summary:
      'Strategic planning for system integration, including API design, data migration strategies, and change management processes.',
    isActive: false,
    messages: [
      {
        id: 'msg-010-001',
        sender: 'user',
        content:
          "We're planning to integrate multiple legacy systems. What's the best approach to minimize risks?",
        position: 1,
        tokens: 18,
      },
      {
        id: 'msg-010-002',
        sender: 'agent',
        content:
          "Legacy system integration is a critical project that requires careful planning. Here's a risk-minimized approach:\n\n**🎯 Strategic Framework:**\n\n**Phase 1: Assessment & Planning (4-6 weeks)**\n- Complete system inventory and dependency mapping\n- Data flow analysis and integration point identification\n- Risk assessment matrix (technical, business, operational)\n- Stakeholder alignment and communication plan\n\n**Phase 2: Architecture Design (3-4 weeks)**\n- API-first integration strategy\n- Event-driven architecture for loose coupling\n- Data transformation and validation layers\n- Rollback and disaster recovery procedures\n\n**Phase 3: Pilot Implementation (6-8 weeks)**\n- Start with least critical system integration\n- Implement comprehensive monitoring and logging\n- Automated testing and validation pipelines\n- User acceptance testing with key stakeholders\n\n**🛡️ Risk Mitigation Strategies:**\n- **Parallel running:** Keep old systems operational during transition\n- **Feature flags:** Enable gradual rollout and quick rollback\n- **Data validation:** Implement comprehensive data integrity checks\n- **Communication:** Regular stakeholder updates and training\n\nWhat types of legacy systems are you integrating? (ERP, CRM, custom databases, etc.)",
        position: 2,
        tokens: 267,
        metadata: JSON.stringify({ confidence: 0.89, processing_time: 2000 }),
      },
    ],
  },
  {
    id: 'conv-011',
    agentId: 'agent-004',
    userId: 'user-id',
    title: 'Blog Content Strategy',
    summary:
      'Content strategy development for a technology blog, including editorial calendar, SEO optimization, and audience engagement tactics.',
    isActive: true,
    messages: [
      {
        id: 'msg-011-001',
        sender: 'user',
        content:
          "I'm starting a tech blog. How should I plan my content strategy for the first 6 months?",
        position: 1,
        tokens: 19,
      },
      {
        id: 'msg-011-002',
        sender: 'agent',
        content:
          'Fantastic venture! A well-planned content strategy is crucial for blog success. Here\'s your 6-month roadmap:\n\n**🎯 Foundation Phase (Month 1-2):**\n\n**Content Pillars (3-4 core themes):**\n- **Tutorials & How-tos:** Step-by-step technical guides\n- **Industry Insights:** Trends, news analysis, and predictions\n- **Tool Reviews:** Software, frameworks, and technology evaluations\n- **Career Development:** Skills, interviews, and professional growth\n\n**Content Calendar Structure:**\n- **Monday:** Industry news roundup\n- **Wednesday:** Technical tutorial\n- **Friday:** Tool review or opinion piece\n- **Bonus:** Guest posts or community features\n\n**🚀 Growth Phase (Month 3-4):**\n- Analyze top-performing content types\n- Develop signature series (e.g., "Week in AI," "Code Review Friday")\n- Begin guest posting on established blogs\n- Start building email newsletter\n\n**📈 Optimization Phase (Month 5-6):**\n- SEO optimization based on keyword research\n- Repurpose content across platforms (Twitter, LinkedIn, YouTube)\n- Community building through comments and social engagement\n- Collaborate with other tech bloggers\n\nWhat\'s your target audience and technical expertise level?',
        position: 2,
        tokens: 258,
        metadata: JSON.stringify({ confidence: 0.91, processing_time: 1800 }),
      },
    ],
  },
  {
    id: 'conv-012',
    agentId: 'agent-002',
    userId: 'super-admin-id',
    title: 'Debugging Session',
    summary:
      'Collaborative debugging session for a complex performance issue in a distributed system. Covered debugging strategies, monitoring tools, and root cause analysis.',
    isActive: true,
    messages: [
      {
        id: 'msg-012-001',
        sender: 'user',
        content:
          'I have a memory leak in my Node.js application that only happens in production. How should I debug this?',
        position: 1,
        tokens: 21,
      },
      {
        id: 'msg-012-002',
        sender: 'agent',
        content:
          "Production memory leaks are tricky but solvable! Here's a systematic debugging approach:\n\n**🔍 Immediate Diagnosis:**\n\n**1. Enable Production Monitoring:**\n```javascript\n// Add memory monitoring\nsetInterval(() => {\n  const usage = process.memoryUsage();\n  console.log(JSON.stringify({\n    timestamp: new Date().toISOString(),\n    rss: Math.round(usage.rss / 1024 / 1024),\n    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),\n    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),\n    external: Math.round(usage.external / 1024 / 1024)\n  }));\n}, 30000); // Every 30 seconds\n```\n\n**2. Production Heap Dumps:**\n```bash\n# Generate heap snapshot\nkill -USR2 <pid>\n# Or use clinic.js\nnpx clinic doctor -- node app.js\n```\n\n**🕵️ Common Leak Sources:**\n- Event listeners not removed\n- Timers/intervals not cleared\n- Global variables accumulating data\n- Closures holding references\n- Database connections not closed\n- Large objects in memory cache\n\n**📊 Analysis Tools:**\n- Chrome DevTools (heap snapshots)\n- clinic.js for performance profiling\n- `why-is-node-running` for active handles\n\nCan you share what type of application this is? (Express API, microservice, etc.)",
        position: 2,
        tokens: 295,
        metadata: JSON.stringify({ confidence: 0.94, processing_time: 2300 }),
      },
    ],
  },
];
