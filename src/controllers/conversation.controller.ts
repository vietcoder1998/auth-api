import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { llmService } from '../services/llm.service';
import { commandService } from '../services/command.service';

const prisma = new PrismaClient();

// Get conversations for a user
export async function getConversations(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    // Extract query parameters
    const {
      agentId,
      page = '1',
      limit = '20',
      pageSize = limit,
      search = '',
      q = search,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Parse pagination parameters
    const currentPage = Math.max(1, parseInt(page as string, 10));
    const currentLimit = Math.max(1, Math.min(100, parseInt(pageSize as string, 10)));
    const skip = (currentPage - 1) * currentLimit;

    // Build where clause for search and filters
    const whereClause: any = { userId };
    
    // Agent filter
    if (agentId && typeof agentId === 'string') {
      whereClause.agentId = agentId;
    }

    // Search across multiple fields
    if (q && typeof q === 'string' && q.trim()) {
      const searchTerm = q.trim();
      whereClause.OR = [
        { title: { contains: searchTerm } },
        {
          messages: {
            some: {
              content: { contains: searchTerm }
            }
          }
        }
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'title') {
      orderBy.title = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'updatedAt') {
      orderBy.updatedAt = sortOrder;
    } else {
      orderBy.updatedAt = 'desc'; // Default
    }

    // Get total count for pagination
    const total = await prisma.conversation.count({ where: whereClause });

    // Get conversations with pagination
    const conversations = await prisma.conversation.findMany({
      where: whereClause,
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
      orderBy,
      skip,
      take: currentLimit,
    });

    // Transform the data to include lastMessage
    const transformedConversations = conversations.map(conv => ({
      ...conv,
      lastMessage: conv.messages[0] || null,
      messages: undefined // Remove the messages array since we only want the last one
    }));

    res.json({
      data: transformedConversations,
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit)
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
        orderBy: { position: 'asc' },
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

// Get all messages for a conversation
export async function getMessages(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params; // conversation id
    const { page = 1, limit = 100, sortOrder = 'asc' } = req.query;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get messages with pagination
    const [messages, totalMessages] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId: id },
        orderBy: { position: sortOrder === 'desc' ? 'desc' : 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.message.count({ where: { conversationId: id } })
    ]);

    res.json({
      data: messages,
      total: totalMessages,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalMessages / limitNum),
      conversationId: id
    });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
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

    // Get the next position for this conversation
    const lastMessage = await prisma.message.findFirst({
      where: { conversationId: id },
      orderBy: { position: 'desc' }
    });
    const nextPosition = (lastMessage?.position || 0) + 1;

    // Create user message
    const message = await prisma.message.create({
      data: {
        conversationId: id,
        sender,
        content,
        metadata: metadata ? JSON.stringify(metadata) : null,
        position: nextPosition,
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
            tokens: aiResponse.tokens,
            position: nextPosition + 1,
          }
        });

        res.status(201).json({
          userMessage: message,
          aiMessage: aiMessage,
          messages: [message, aiMessage],
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
          aiMessage: null,
          messages: [message],
          aiError: 'AI response generation failed'
        });
      }
    } else {
      res.status(201).json({
        userMessage: message,
        aiMessage: null,
        messages: [message]
      });
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

// LLM conversation control

// Execute command in conversation
export async function executeCommand(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { id: conversationId } = req.params;
    const { type, parameters } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!type) {
      return res.status(400).json({ error: 'Command type is required' });
    }

    // Check if conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: { agent: true }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Execute command
    const result = await commandService.processCommand({
      conversationId,
      userId,
      agentId: conversation.agentId,
      type,
      parameters
    });

    // Log the command execution
    await prisma.message.create({
      data: {
        conversationId,
        sender: 'system',
        content: `Command executed: /${type} - ${result.message}`,
        metadata: JSON.stringify({
          command: type,
          parameters,
          result: result.success
        })
      }
    });

    res.json(result);
  } catch (err) {
    console.error('Execute command error:', err);
    res.status(500).json({ error: 'Failed to execute command' });
  }
}