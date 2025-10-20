import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { promptHistoryService } from '../services/promptHistory.service';
const prisma = new PrismaClient();

// Create prompt
export async function createPromptHistory(req: Request, res: Response) {
  const userId = req.user?.id;
  const { conversationId, prompt } = req.body;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!conversationId || !prompt)
    return res.status(400).json({ error: 'conversationId and prompt required' });

  // Check conversation ownership
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
  });
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

  const result = await promptHistoryService.createPrompt(conversationId, prompt);
  res.status(201).json(result);
}

// Get all prompts for a conversation
export async function getPromptHistories(req: Request, res: Response) {
  const userId = req.user?.id;
  const { conversationId } = req.params;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  // Check conversation ownership
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
  });
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

  const prompts = await promptHistoryService.getPrompts(conversationId);
  res.json(prompts);
}

// Get single prompt by id
export async function getPromptHistoryById(req: Request, res: Response) {
  const userId = req.user?.id;
  const { id } = req.params;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const prompt = await promptHistoryService.getPromptById(id);
  if (!prompt) return res.status(404).json({ error: 'Prompt not found' });

  // Optionally check conversation ownership here

  res.json(prompt);
}

// Update prompt
export async function updatePromptHistory(req: Request, res: Response) {
  const userId = req.user?.id;
  const { id } = req.params;
  const { prompt } = req.body;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const existing = await promptHistoryService.getPromptById(id);
  if (!existing) return res.status(404).json({ error: 'Prompt not found' });

  // Optionally check conversation ownership here

  const updated = await promptHistoryService.updatePrompt(id, prompt);
  res.json(updated);
}

// Delete prompt
export async function deletePromptHistory(req: Request, res: Response) {
  const userId = req.user?.id;
  const { id } = req.params;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const existing = await promptHistoryService.getPromptById(id);
  if (!existing) return res.status(404).json({ error: 'Prompt not found' });

  // Optionally check conversation ownership here

  await promptHistoryService.deletePrompt(id);
  res.json({ message: 'Prompt deleted' });
}

// Get all prompts (not bound to conversation)
export async function getAllPromptHistories(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  // Optionally: Only return prompts for conversations owned by user
  // For now, return all prompts (admin use)
  const prompts = await promptHistoryService.getAllPrompts();
  res.json(prompts);
}
