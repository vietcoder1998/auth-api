import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { llmService } from '../services/llm.service';

const prisma = new PrismaClient();

// Get conversations for a user
export async function getConversations(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { agentId, page = 1, limit = 20 } = req.query;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId };
    if (agentId) {
      where.agentId = agentId as string;
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, nickname: true, status: true }
          },
          agent: {
            select: { id: true, name: true, model: true, isActive: true }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, content: true, sender: true, createdAt: true, tokens: true }
          },
          _count: {
            select: { messages: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.conversation.count({ where })
    ]);

    // Transform the data to include lastMessage
    const transformedConversations = conversations.map(conv => ({
      ...conv,
      lastMessage: conv.messages[0] || null,
      messages: undefined // Remove the messages array since we only want the last one
    }));

    res.json({
      data: transformedConversations,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
}

// Create new conversation
export async function createConversation(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { agentId, title } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }

    // Check if agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId }
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const conversation = await prisma.conversation.create({
      data: {
        userId,
        agentId,
        title: title || 'New Conversation',
      },
      include: {
        user: {
          select: { id: true, email: true, nickname: true, status: true }
        },
        agent: {
          select: { id: true, name: true, model: true, isActive: true }
        },
        _count: {
          select: { messages: true }
        }
      }
    });

    res.status(201).json(conversation);
  } catch (err) {
    console.error('Create conversation error:', err);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
}

// Get single conversation with messages
export async function getConversation(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get conversation
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId },
      include: {
        user: {
          select: { id: true, email: true, nickname: true, status: true }
        },
        agent: {
          select: { id: true, name: true, model: true, systemPrompt: true, isActive: true }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get messages with pagination
    const [messages, totalMessages] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.message.count({ where: { conversationId: id } })
    ]);

    res.json({
      ...conversation,
      messages: {
        data: messages,
        total: totalMessages,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalMessages / limitNum)
      }
    });
  } catch (err) {
    console.error('Get conversation error:', err);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
}

// Add message to conversation
export async function addMessage(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params; // conversation id
    const { content, sender = 'user', metadata } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Check if conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId },
      include: {
        agent: {
          select: { id: true, name: true, model: true, systemPrompt: true, config: true }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Create user message
    const message = await prisma.message.create({
      data: {
        conversationId: id,
        sender,
        content,
        metadata: metadata ? JSON.stringify(metadata) : null,
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    // If it's a user message, generate AI response
    if (sender === 'user') {
      try {
        const aiResponse = await llmService.generateConversationResponse(id, content, conversation.agent.id);
        
        const aiMessage = await prisma.message.create({
          data: {
            conversationId: id,
            sender: 'agent',
            content: aiResponse.content,
            metadata: JSON.stringify(aiResponse.metadata),
            tokens: aiResponse.tokens
          }
        });

        res.status(201).json({
          userMessage: message,
          aiMessage: aiMessage,
          aiMetadata: {
            model: aiResponse.model,
            tokens: aiResponse.tokens,
            processingTime: aiResponse.processingTime
          }
        });
      } catch (aiError) {
        console.error('AI response generation failed:', aiError);
        // Still return the user message even if AI fails
        res.status(201).json({
          userMessage: message,
          aiError: 'AI response generation failed'
        });
      }
    } else {
      res.status(201).json(message);
    }
  } catch (err) {
    console.error('Add message error:', err);
    res.status(500).json({ error: 'Failed to add message' });
  }
}

// Update conversation
export async function updateConversation(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { title, summary, isActive } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if conversation belongs to user
    const existingConversation = await prisma.conversation.findFirst({
      where: { id, userId }
    });

    if (!existingConversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (summary !== undefined) updateData.summary = summary;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, email: true, nickname: true, status: true }
        },
        agent: {
          select: { id: true, name: true, model: true, isActive: true }
        },
        _count: {
          select: { messages: true }
        }
      }
    });

    res.json(updatedConversation);
  } catch (err) {
    console.error('Update conversation error:', err);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
}

// Delete conversation
export async function deleteConversation(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if conversation belongs to user
    const existingConversation = await prisma.conversation.findFirst({
      where: { id, userId }
    });

    if (!existingConversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    await prisma.conversation.delete({
      where: { id }
    });

    res.json({ message: 'Conversation deleted successfully' });
  } catch (err) {
    console.error('Delete conversation error:', err);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
}

