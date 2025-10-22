import { Request, Response } from 'express';
import { agentService } from '../services/agent.service';

// Get all agents for a user
export async function getAgents(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { page = '1', limit = '10', search = '', q = '', model } = req.query;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    // Use search param (q or search)
    const searchTerm = (q as string) || (search as string) || '';
    const currentPage = Math.max(1, parseInt(page as string, 10));
    const currentLimit = Math.max(1, Math.min(100, parseInt(limit as string, 10)));
    // Use agentService for logic
    const result = await agentService.getUserAgents(userId, currentPage, currentLimit, searchTerm);
    res.json(result);
  } catch (err) {
    console.error('Get agents error:', err);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
}

// Create new agent
export async function createAgent(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { name, description, model, aiModelId, personality, systemPrompt, config } = req.body;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    if (!name) {
      return res.status(400).json({ error: 'Agent name is required' });
    }
    const agent = await agentService.createAgent({
      userId,
      name,
      description,
      model,
      aiModelId,
      personality,
      systemPrompt,
      config,
    });
    res.status(201).json(agent);
  } catch (err) {
    console.error('Create agent error:', err);
    res.status(500).json({ error: 'Failed to create agent' });
  }
}

// Get single agent
export async function getAgent(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    // Use agentService for logic
    const agent = await agentService.getAgentById(id);
    if (!agent || agent.user.id !== userId) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(agent);
  } catch (err) {
    console.error('Get agent error:', err);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
}

// Update agent
export async function updateAgent(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { name, description, model, aiModelId, personality, systemPrompt, config, isActive } =
      req.body;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    // Check if agent belongs to user
    const agent = await agentService.getAgentById(id);
    if (!agent || agent.user.id !== userId) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (model !== undefined) updateData.model = model;
    if (aiModelId !== undefined) updateData.aiModelId = aiModelId;
    if (personality !== undefined) updateData.personality = personality;
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt;
    if (config !== undefined) updateData.config = config;
    if (isActive !== undefined) updateData.isActive = isActive;
    const updatedAgent = await agentService.updateAgent(id, updateData);
    res.json(updatedAgent);
  } catch (err) {
    console.error('Update agent error:', err);
    res.status(500).json({ error: 'Failed to update agent' });
  }
}

// Delete agent
export async function deleteAgent(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const agent = await agentService.getAgentById(id);
    if (!agent || agent.user.id !== userId) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    await agentService.deleteAgent(id);
    res.json({ message: 'Agent deleted successfully' });
  } catch (err) {
    console.error('Delete agent error:', err);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
}

// Add memory to agent
export async function addAgentMemory(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { type, content, metadata, importance = 1 } = req.body;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const agent = await agentService.getAgentById(id);
    if (!agent || agent.user.id !== userId) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    const memory = await agentService.addMemory(id, content, type, importance, metadata);
    res.status(201).json(memory);
  } catch (err) {
    console.error('Add agent memory error:', err);
    res.status(500).json({ error: 'Failed to add memory' });
  }
}

// Get agent memories
export async function getAgentMemories(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { type, page = 1, limit = 50 } = req.query;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const agent = await agentService.getAgentById(id);
    if (!agent || agent.user.id !== userId) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const result = await agentService.getAgentMemories(id, type as string, pageNum, limitNum);
    res.json(result);
  } catch (err) {
    console.error('Get agent memories error:', err);
    res.status(500).json({ error: 'Failed to fetch memories' });
  }
}
