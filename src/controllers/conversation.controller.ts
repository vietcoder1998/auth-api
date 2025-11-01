import { Request, Response } from 'express';
import { ConversationDro, ConversationDto, ConversationModel } from '../interfaces';
import { CommandService } from '../services/command.service';
import { conversationService } from '../services/conversation.service';
import { llmService } from '../services/llm.service';
import { BaseController } from './base.controller';

const commandService = new CommandService();

// You may want to define ConversationDto, ConversationDro for typing
export class ConversationController extends BaseController<
  ConversationModel,
  ConversationDto,
  ConversationDro
> {
  constructor() {
    super(conversationService);
  }

  // LLM full process: generate, embed, save, link
  async processAndSaveConversation(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { conversationId, userMessage, agentId } = req.body;
      if (!userId) throw new Error('User not authenticated');
      if (!conversationId || !userMessage || !agentId) {
        throw new Error('conversationId, userMessage, and agentId are required');
      }
      const result = await llmService.processAndSaveConversation(
        conversationId,
        userMessage,
        agentId,
      );
      this.sendSuccess(res, result, 'Conversation processed successfully', 201);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  // --- PromptHistory CRUD ---
  async createPromptHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { conversationId, prompt } = req.body;
      if (!userId) throw new Error('Unauthorized');
      if (!conversationId || !prompt)
        throw new Error('conversationId and prompt required');
      const promptHistory = await conversationService.createPromptHistory(
        userId,
        conversationId,
        prompt,
      );
      this.sendSuccess(res, promptHistory, 'Prompt history created', 201);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async getPromptHistories(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { conversationId } = req.params;
      if (!userId) throw new Error('Unauthorized');
      const prompts = await conversationService.getPromptHistories(userId, conversationId);
      this.sendSuccess(res, prompts);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async updatePromptHistory(req: Request, res: Response) {
    try {
      const userId = req?.user?.id;
      const { id } = req.params;
      const { prompt } = req.body;
      if (!userId) throw new Error('Unauthorized');
      const updated = await conversationService.updatePromptHistory(userId, id, prompt);
      this.sendSuccess(res, updated);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async deletePromptHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      if (!userId) throw new Error('Unauthorized');
      await conversationService.deletePromptHistory(userId, id);
      this.sendSuccess(res, null, 'Prompt deleted');
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async getConversations(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) throw new Error('User not authenticated');
      const result = await conversationService.getConversations(userId, req.query);
      this.sendSuccess(res, result);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async createConversation(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { agentId, title } = req.body;
      if (!userId) throw new Error('User not authenticated');
      if (!agentId) throw new Error('Agent ID is required');
      const conversation = await conversationService.createConversation(userId, agentId, title);
      this.sendSuccess(res, conversation, 'Conversation created', 201);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async getConversation(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { page = 1, limit = 50 } = req.query;
      if (!userId) throw new Error('User not authenticated');
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const result = await conversationService.getConversation(userId, id, pageNum, limitNum);
      this.sendSuccess(res, result);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async getMessages(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { page = 1, limit = 100, sortOrder = 'asc' } = req.query;
      if (!userId) throw new Error('User not authenticated');
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const result = await conversationService.getConversationMessages(id, pageNum, limitNum);
      this.sendSuccess(res, result);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async addMessage(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { content, sender = 'user', metadata } = req.body;
      if (!userId) throw new Error('User not authenticated');
      if (!content) throw new Error('Message content is required');
      const result = await conversationService.addMessage({
        conversationId: id,
        sender,
        content,
        metadata,
      });
      this.sendSuccess(res, result, 'Message added', 201);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async updateConversation(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { title, summary, isActive } = req.body;
      if (!userId) throw new Error('User not authenticated');
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (summary !== undefined) updateData.summary = summary;
      if (isActive !== undefined) updateData.isActive = isActive;
      const updatedConversation = await conversationService.updateConversation(
        userId,
        id,
        updateData,
      );
      this.sendSuccess(res, updatedConversation);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async deleteConversation(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      if (!userId) throw new Error('User not authenticated');
      const result = await conversationService.deleteConversation(userId, id);
      this.sendSuccess(res, result);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async executeCommand(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id: conversationId } = req.params;
      const { type, parameters } = req.body;
      if (!userId) throw new Error('User not authenticated');
      if (!type) throw new Error('Command type is required');
      if (!parameters) throw new Error('Command parameters are required');
      
      const result = await conversationService.executeCommand(
        userId,
        conversationId,
        type,
        parameters,
        commandService,
      );
      this.sendSuccess(res, result);
    } catch (err) {
      this.handleError(res, err);
    }
  }
}

export const conversationController = new ConversationController();
