import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

// Get all agents for a user
export async function getAgents(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10, search } = req.query;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId };
    
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        include: {
          _count: {
            select: { 
              conversations: true,
              memories: true,
              tools: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.agent.count({ where })
    ]);

    res.json({
      data: agents,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (err) {
    console.error('Get agents error:', err);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
}

// Create new agent
export async function createAgent(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { name, description, model = 'gpt-4', personality, systemPrompt, config } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Agent name is required' });
    }

    const agent = await prisma.agent.create({
      data: {
        userId,
        name,
        description,
        model,
        personality: personality ? JSON.stringify(personality) : null,
        systemPrompt,
        config: config ? JSON.stringify(config) : null,
      },
      include: {
        _count: {
          select: { 
            conversations: true,
            memories: true,
            tools: true
          }
        }
      }
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

    const agent = await prisma.agent.findFirst({
      where: { id, userId },
      include: {
        tools: true,
        _count: {
          select: { 
            conversations: true,
            memories: true
          }
        }
      }
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Parse JSON fields for response
    const agentResponse = {
      ...agent,
      personality: agent.personality ? JSON.parse(agent.personality) : null,
      config: agent.config ? JSON.parse(agent.config) : null,
    };

    res.json(agentResponse);
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
    const { name, description, model, personality, systemPrompt, config, isActive } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if agent belongs to user
    const existingAgent = await prisma.agent.findFirst({
      where: { id, userId }
    });

    if (!existingAgent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (model !== undefined) updateData.model = model;
    if (personality !== undefined) updateData.personality = JSON.stringify(personality);
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt;
    if (config !== undefined) updateData.config = JSON.stringify(config);
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedAgent = await prisma.agent.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { 
            conversations: true,
            memories: true,
            tools: true
          }
        }
      }
    });

    // Parse JSON fields for response
    const agentResponse = {
      ...updatedAgent,
      personality: updatedAgent.personality ? JSON.parse(updatedAgent.personality) : null,
      config: updatedAgent.config ? JSON.parse(updatedAgent.config) : null,
    };

    res.json(agentResponse);
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

    // Check if agent belongs to user
    const existingAgent = await prisma.agent.findFirst({
      where: { id, userId }
    });

    if (!existingAgent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    await prisma.agent.delete({
      where: { id }
    });

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

    // Check if agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: { id, userId }
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const memory = await prisma.agentMemory.create({
      data: {
        agentId: id,
        type,
        content,
        metadata: metadata ? JSON.stringify(metadata) : null,
        importance,
      }
    });

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

    // Check if agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: { id, userId }
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { agentId: id };
    if (type) {
      where.type = type;
    }

    const [memories, total] = await Promise.all([
      prisma.agentMemory.findMany({
        where,
        orderBy: [
          { importance: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limitNum,
      }),
      prisma.agentMemory.count({ where })
    ]);

    res.json({
      data: memories,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (err) {
    console.error('Get agent memories error:', err);
    res.status(500).json({ error: 'Failed to fetch memories' });
  }
}