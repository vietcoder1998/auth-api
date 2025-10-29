import { Request, Response } from 'express';
import { aiModelService } from '../services/aiModel.service';

export class AIModelController {
  async create(req: Request, res: Response) {
    try {
      const model = await aiModelService.createAIModel(req.body);
      res.status(201).json(model);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const model = await aiModelService.getAIModelById(req.params.id);
      if (!model) return res.status(404).json({ error: 'Model not found' });
      res.json(model);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const models = await aiModelService.getAllAIModels();
      res.json(models);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const model = await aiModelService.updateAIModel(req.params.id, req.body);
      res.json(model);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const model = await aiModelService.deleteAIModel(req.params.id);
      res.json(model);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  }

  async fetchGeminiModels(req: Request, res: Response) {
    try {
      const geminiConfig = req.body;
      const models = await aiModelService.fetchGeminiModels(geminiConfig);
      res.json({ models });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  }
}

export const aiModelController = new AIModelController();
