// Mock FAQ data for seeding
import { mockConversations } from './conversations';
import { mockAgents } from './agents';

export const mockFaqs = [
  {
    question: 'How do I reset my password?',
    answer: 'To reset your password, go to the login page and click on "Forgot Password". Follow the instructions sent to your email.',
    type: 'manual',
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: [
      {
        sender: 'user',
        content: 'How do I reset my password?',
        type: 'question',
      },
      {
        sender: 'agent',
        content: 'To reset your password, go to the login page and click on "Forgot Password". Follow the instructions sent to your email.',
        type: 'answer',
      },
    ],
  },
  {
    question: 'What is an AI Agent?',
    answer: 'An AI Agent is a virtual assistant that can help you with various tasks using artificial intelligence.',
    type: 'agent',
    aiAgentId: mockAgents[0]?.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: [
      {
        sender: 'user',
        content: 'What is an AI Agent?',
        type: 'question',
      },
      {
        sender: 'agent',
        content: 'An AI Agent is a virtual assistant that can help you with various tasks using artificial intelligence.',
        type: 'answer',
      },
    ],
  },
  {
    question: 'How do I view my conversation history?',
    answer: 'Navigate to the Conversations page from the sidebar to view your conversation history.',
    type: 'manual',
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: [
      {
        sender: 'user',
        content: 'How do I view my conversation history?',
        type: 'question',
      },
      {
        sender: 'agent',
        content: 'Navigate to the Conversations page from the sidebar to view your conversation history.',
        type: 'answer',
      },
    ],
  },
  {
    question: 'How do I use prompt history?',
    answer: 'Prompt history allows you to review and reuse previous prompts in your conversations.',
    type: 'prompt',
    promptId: mockConversations[0]?.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: [
      {
        sender: 'user',
        content: 'How do I use prompt history?',
        type: 'question',
      },
      {
        sender: 'agent',
        content: 'Prompt history allows you to review and reuse previous prompts in your conversations.',
        type: 'answer',
      },
    ],
  },
  // New FAQ for completed chatbot
  {
    question: 'How do I know when the chatbot has completed my request?',
    answer: 'The chatbot will notify you with a completion message and display the results in the chat window.',
    type: 'manual',
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: [
      {
        sender: 'user',
        content: 'How do I know when the chatbot has completed my request?',
        type: 'question',
      },
      {
        sender: 'agent',
        content: 'The chatbot will notify you with a completion message and display the results in the chat window.',
        type: 'answer',
      },
    ],
  },
];

// Permissions for FAQ management
export const mockFaqPermissions = [
  {
    name: 'admin_faqs_get',
    description: 'View all FAQs',
    category: 'faq',
    route: '/admin/faqs',
    method: 'GET',
  },
  {
    name: 'admin_faqs_post',
    description: 'Create FAQ',
    category: 'faq',
    route: '/admin/faqs',
    method: 'POST',
  },
  {
    name: 'admin_faqs_put',
    description: 'Update FAQ',
    category: 'faq',
    route: '/admin/faqs/:id',
    method: 'PUT',
  },
  {
    name: 'admin_faqs_delete',
    description: 'Delete FAQ',
    category: 'faq',
    route: '/admin/faqs/:id',
    method: 'DELETE',
  },
];

// Roles for FAQ management
export const mockFaqRoles = [
  {
    name: 'faq_admin',
    description: 'FAQ Administrator',
    permissions: [
      { name: 'admin_faqs_get' },
      { name: 'admin_faqs_post' },
      { name: 'admin_faqs_put' },
      { name: 'admin_faqs_delete' },
    ],
  },
  {
    name: 'faq_viewer',
    description: 'FAQ Viewer',
    permissions: [
      { name: 'admin_faqs_get' },
    ],
  },
];
