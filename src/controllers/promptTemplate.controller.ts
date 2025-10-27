import { Request, Response } from 'express';
import { PromptTemplateService } from '../services/promptTemplate.service';

const service = new PromptTemplateService();

export class PromptTemplateController {
  async create(req: Request, res: Response) {
    try {
      const promptTemplate = await service.create(req.body);
      res.json({ data: promptTemplate });
    } catch (error) {
      const err = error as Error;
      res.status(400).json({ error: err.message });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const templates = await service.findAll();
      res.json({ data: templates });
    } catch (error) {
      const err = error as Error;
      res.status(400).json({ error: err.message });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const template = await service.findById(req.params.id);
      if (!template) return res.status(404).json({ error: 'Not found' });
      res.json({ data: template });
    } catch (error) {
      const err = error as Error;
      res.status(400).json({ error: err.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const template = await service.update(req.params.id, req.body);
      res.json({ data: template });
    } catch (error) {
      const err = error as Error;
      res.status(400).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const template = await service.delete(req.params.id);
      res.json({ data: template });
    } catch (error) {
      const err = error as Error;
      res.status(400).json({ error: err.message });
    }
  }
}
