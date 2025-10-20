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
  },
  {
    question: 'What is an AI Agent?',
    answer: 'An AI Agent is a virtual assistant that can help you with various tasks using artificial intelligence.',
    type: 'agent',
    aiAgentId: mockAgents[0]?.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    question: 'How do I view my conversation history?',
    answer: 'Navigate to the Conversations page from the sidebar to view your conversation history.',
    type: 'manual',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    question: 'How do I use prompt history?',
    answer: 'Prompt history allows you to review and reuse previous prompts in your conversations.',
    type: 'prompt',
    promptId: mockConversations[0]?.id,
    createdAt: new Date(),
    updatedAt: new Date(),
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
