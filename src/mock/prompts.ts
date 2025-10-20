// Mock prompt history data for seeding
import { mockConversations } from './conversations';

export const mockPrompts = [
  {
    conversationId: mockConversations[0]?.id,
    prompt: 'What is the weather today?',
    createdAt: new Date(),
  },
  {
    conversationId: mockConversations[1]?.id,
    prompt: 'Summarize the last meeting notes.',
    createdAt: new Date(),
  },
  {
    conversationId: mockConversations[0]?.id,
    prompt: 'Remind me to call John tomorrow.',
    createdAt: new Date(),
  },
];

// Permissions for prompt history management
export const mockPromptPermissions = [
  {
    name: 'admin_prompts_get',
    description: 'View all prompt histories',
    category: 'prompt',
    route: '/admin/prompts',
    method: 'GET',
  },
  {
    name: 'admin_prompts_post',
    description: 'Create prompt history',
    category: 'prompt',
    route: '/admin/prompts',
    method: 'POST',
  },
  {
    name: 'admin_prompts_put',
    description: 'Update prompt history',
    category: 'prompt',
    route: '/admin/prompts/:id',
    method: 'PUT',
  },
  {
    name: 'admin_prompts_delete',
    description: 'Delete prompt history',
    category: 'prompt',
    route: '/admin/prompts/:id',
    method: 'DELETE',
  },
];

// Roles for prompt history management
export const mockPromptRoles = [
  {
    name: 'prompt_admin',
    description: 'Prompt History Administrator',
    permissions: [
      { name: 'admin_prompts_get' },
      { name: 'admin_prompts_post' },
      { name: 'admin_prompts_put' },
      { name: 'admin_prompts_delete' },
    ],
  },
  {
    name: 'prompt_viewer',
    description: 'Prompt History Viewer',
    permissions: [
      { name: 'admin_prompts_get' },
    ],
  },
];
