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

  /**
   * Select models for a given platform or platform type.
   * Query params supported:
   * - platformId (string): returns stored models for that platform
   * - platformType (string): if 'gemini' and a geminiConfig is provided in the body, will fetch remote Gemini models
   * If no params provided, returns all stored models.
   */
  async selectModels(req: Request, res: Response) {
    try {
      const platformId = req.query.platformId as string | undefined;
      const platformType = req.query.platformType as string | undefined;
      const geminiConfig = req.body?.geminiConfig;

      let modelNames: string[] = [];

      if (platformId) {
        const local = await aiModelService.getAIModelsByPlatform(platformId);
        modelNames = local.map((m: any) => m.name);
      }

      // If platformType explicitly requests Gemini, or geminiConfig present in body, fetch remote models
      if (platformType === 'gemini' || geminiConfig) {
        const remote = await aiModelService.fetchGeminiModels(geminiConfig || {});
        modelNames = Array.from(new Set([...modelNames, ...remote]));
      }

      // If nothing requested, return all stored models
      if (!platformId && !platformType && !geminiConfig) {
        const all = await aiModelService.getAllAIModels();
        modelNames = all.map((m: any) => m.name);
      }

      res.json({ models: modelNames });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  }
}

export const aiModelController = new AIModelController();
