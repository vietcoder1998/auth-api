import { Request, Response } from 'express';
import { ConversationDto, ConversationModel } from '../interfaces';
import { CommandService } from '../services/command.service';
import { conversationService } from '../services/conversation.service';
import { llmService } from '../services/llm.service';
import { BaseController } from './base.controller';

const commandService = new CommandService();

// You may want to define ConversationDto, ConversationDro for typing
export class ConversationController extends BaseController<
  ConversationModel,
  ConversationDto,
  ConversationDto
> {
  constructor() {
    super(conversationService);
  }

  // LLM full process: generate, embed, save, link
  async processAndSaveConversation(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { conversationId, userMessage, agentId } = req.body;
      if (!userId) return this.handleError(res, 'User not authenticated', 401);
      if (!conversationId || !userMessage || !agentId) {
        return this.handleError(res, 'conversationId, userMessage, and agentId are required', 400);
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
      if (!userId) return this.handleError(res, 'Unauthorized', 401);
      if (!conversationId || !prompt)
        return this.handleError(res, 'conversationId and prompt required', 400);
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
      if (!userId) return this.handleError(res, 'Unauthorized', 401);
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
      if (!userId) return this.handleError(res, 'Unauthorized', 401);
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
      if (!userId) return this.handleError(res, 'Unauthorized', 401);
      await conversationService.deletePromptHistory(userId, id);
      this.sendSuccess(res, null, 'Prompt deleted');
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async getConversations(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return this.handleError(res, 'User not authenticated', 401);
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
      if (!userId) return this.handleError(res, 'User not authenticated', 401);
      if (!agentId) return this.handleError(res, 'Agent ID is required', 400);
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
      if (!userId) return this.handleError(res, 'User not authenticated', 401);
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
      if (!userId) return this.handleError(res, 'User not authenticated', 401);
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
      if (!userId) return this.handleError(res, 'User not authenticated', 401);
      if (!content) return this.handleError(res, 'Message content is required', 400);
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
      if (!userId) return this.handleError(res, 'User not authenticated', 401);
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
      if (!userId) return this.handleError(res, 'User not authenticated', 401);
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
      if (!userId) return this.handleError(res, 'User not authenticated', 401);
      if (!type) return this.handleError(res, 'Command type is required', 400);
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
