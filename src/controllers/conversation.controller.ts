
import { Request, Response } from 'express';
import { conversationService } from '../services/conversation.service';
import { llmService } from '../services/llm.service';
import { CommandService } from '../services/command.service';

const commandService = new CommandService();

// LLM full process: generate, embed, save, link
export async function processAndSaveConversation(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { conversationId, userMessage, agentId } = req.body;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    if (!conversationId || !userMessage || !agentId) {
      return res.status(400).json({ error: 'conversationId, userMessage, and agentId are required' });
    }
    const result = await llmService.processAndSaveConversation(conversationId, userMessage, agentId);
    res.status(201).json(result);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to process and save conversation';
    res.status(500).json({ error: errorMsg });
  }
}
// --- PromptHistory CRUD ---
export async function createPromptHistory(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { conversationId, prompt } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!conversationId || !prompt) return res.status(400).json({ error: 'conversationId and prompt required' });
    const promptHistory = await conversationService.createPromptHistory(userId, conversationId, prompt);
    res.status(201).json(promptHistory);
  } catch (err) {
  const errorMsg = err instanceof Error ? err.message : 'Failed to create prompt history';
  res.status(500).json({ error: errorMsg });
  }
}

// Get all prompts for a conversation
export async function getPromptHistories(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { conversationId } = req.params;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const prompts = await conversationService.getPromptHistories(userId, conversationId);
    res.json(prompts);
  } catch (err) {
  const errorMsg = err instanceof Error ? err.message : 'Failed to fetch prompt histories';
  res.status(500).json({ error: errorMsg });
  }
}

// Update a prompt history entry
export async function updatePromptHistory(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { prompt } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const updated = await conversationService.updatePromptHistory(userId, id, prompt);
    res.json(updated);
  } catch (err) {
  const errorMsg = err instanceof Error ? err.message : 'Failed to update prompt history';
  res.status(500).json({ error: errorMsg });
  }
}

// Delete a prompt history entry
export async function deletePromptHistory(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    await conversationService.deletePromptHistory(userId, id);
    res.json({ message: 'Prompt deleted' });
  } catch (err) {
  const errorMsg = err instanceof Error ? err.message : 'Failed to delete prompt history';
  res.status(500).json({ error: errorMsg });
  }
}

// Get conversations for a user
export async function getConversations(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    const result = await conversationService.getConversations(userId, req.query);
    res.json(result);
  } catch (err) {
  const errorMsg = err instanceof Error ? err.message : 'Failed to fetch conversations';
  res.status(500).json({ error: errorMsg });
  }
}

// Create new conversation
export async function createConversation(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { agentId, title } = req.body;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    if (!agentId) return res.status(400).json({ error: 'Agent ID is required' });
    const conversation = await conversationService.createConversation(userId, agentId, title);
    res.status(201).json(conversation);
  } catch (err) {
  const errorMsg = err instanceof Error ? err.message : 'Failed to create conversation';
  res.status(500).json({ error: errorMsg });
  }
}

// Get single conversation with messages
export async function getConversation(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const result = await conversationService.getConversation(userId, id, pageNum, limitNum);
    res.json(result);
  } catch (err) {
  const errorMsg = err instanceof Error ? err.message : 'Failed to fetch conversation';
  res.status(500).json({ error: errorMsg });
  }
}

// Get all messages for a conversation
export async function getMessages(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { page = 1, limit = 100, sortOrder = 'asc' } = req.query;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    // Use the correct method from the service
    const result = await conversationService.getConversationMessages(id, pageNum, limitNum);
    res.json(result);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to fetch messages';
    res.status(500).json({ error: errorMsg });
  }
}

export async function addMessage(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { content, sender = 'user', metadata } = req.body;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    if (!content) return res.status(400).json({ error: 'Message content is required' });
    // Use the correct method signature for addMessage
    const result = await conversationService.addMessage({
      conversationId: id,
      sender,
      content,
      metadata,
    });
    res.status(201).json(result);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to add message';
    res.status(500).json({ error: errorMsg });
  }
}

// Update conversation
export async function updateConversation(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { title, summary, isActive } = req.body;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (summary !== undefined) updateData.summary = summary;
    if (isActive !== undefined) updateData.isActive = isActive;
    const updatedConversation = await conversationService.updateConversation(userId, id, updateData);
    res.json(updatedConversation);
  } catch (err) {
  const errorMsg = err instanceof Error ? err.message : 'Failed to update conversation';
  res.status(500).json({ error: errorMsg });
  }
}

// Delete conversation
export async function deleteConversation(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    const result = await conversationService.deleteConversation(userId, id);
    res.json(result);
  } catch (err) {
  const errorMsg = err instanceof Error ? err.message : 'Failed to delete conversation';
  res.status(500).json({ error: errorMsg });
  }
}

// LLM conversation control

// Execute command in conversation
export async function executeCommand(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { id: conversationId } = req.params;
    const { type, parameters } = req.body;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    if (!type) return res.status(400).json({ error: 'Command type is required' });
    const result = await conversationService.executeCommand(userId, conversationId, type, parameters, commandService);
    res.json(result);
  } catch (err) {
  const errorMsg = err instanceof Error ? err.message : 'Failed to execute command';
  res.status(500).json({ error: errorMsg });
  }
}
