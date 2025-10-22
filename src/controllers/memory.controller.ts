import { Request, Response } from 'express';
import { MemoryService } from '../services/memory.service';

export class MemoryController {
  static async create(req: Request, res: Response) {
    try {
      const memory = await MemoryService.create(req.body);
      res.status(201).json(memory);
    } catch (err) {
      const error = err as Error;
      res.status(400).json({ error: error.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const memories = await MemoryService.getAll();
      res.json(memories);
    } catch (err) {
      const error = err as Error;
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const memory = await MemoryService.getById(req.params.id);
      if (!memory) return res.status(404).json({ error: 'Not found' });
      res.json(memory);
    } catch (err) {
      const error = err as Error;
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const memory = await MemoryService.update(req.params.id, req.body);
      res.json(memory);
    } catch (err) {
      const error = err as Error;
      res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await MemoryService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      const error = err as Error;
      res.status(500).json({ error: error.message });
    }
  }
}
