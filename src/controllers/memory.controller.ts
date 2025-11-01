import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { MemoryService } from '../services/memory.service';
import { AgentMemoryModel, AgentMemoryDto, AgentMemoryDro } from '../interfaces/agentmemory.interface';

export class MemoryController extends BaseController<AgentMemoryModel, AgentMemoryDto, AgentMemoryDro> {
  constructor() {
    const memoryService = new MemoryService();
    super(memoryService);
  }

  get memoryService(): MemoryService {
    return this.service as MemoryService;
  }

  /**
   * Override findAll to use MemoryService's getAll method with vector data
   */
  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.q ? { q: req.query.q as string } : undefined;
      const memories = await this.memoryService.getAll(query);
      this.sendSuccess(res, memories);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Override findOne to use MemoryService's getById method with vector data
   */
  async findOne(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const memory = await this.memoryService.getById(id);
      
      if (!memory) {
        res.status(404).json({
          success: false,
          error: 'Memory not found',
        });
        return;
      }
      
      this.sendSuccess(res, memory);
    } catch (error) {
      this.handleError(res, error);
    }
  }
}

export const memoryController = new MemoryController();