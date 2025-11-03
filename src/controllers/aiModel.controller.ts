import { Request, Response } from 'express';
import { AIModelService, aiModelService } from '../services/aiModel.service';
import { BaseController } from './base.controller';
import { AIModelDto, AIModelDro, AIModelModel } from '../interfaces';

export class AIModelController extends BaseController<AIModelModel, AIModelDto, AIModelDro> {
  constructor() {
    super(aiModelService);
  }

  get aiModelService(): AIModelService {
    return this.service as AIModelService;
  }

  /**
   * Override search method to include agents relation
   */
  async search(req: Request, res: Response): Promise<void> {
    try {
      const where = req.body;
      const searchParams = {
        ...where,
        include: {
          agents: true,
          platform: true,
          ...(where?.include || {}),
        },
      };
      const data = await this.aiModelService.search(searchParams);
      this.sendSuccess(res, data);
    } catch (error) {
      this.handleError(res, error);
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
        const local = await this.aiModelService.getAIModelsByPlatform(platformId);
        modelNames = local.map((m: any) => m.name);
      }

      // If platformType explicitly requests Gemini, or geminiConfig present in body, fetch remote models
      if (platformType === 'gemini' || geminiConfig) {
        const remote = await aiModelService.fetchGeminiModels(geminiConfig || {});
        modelNames = Array.from(new Set([...modelNames, ...remote]));
      }

      // If nothing requested, return all stored models
      if (!platformId && !platformType && !geminiConfig) {
        const all = await this.aiModelService.getAllAIModels();
        modelNames = all.map((m: any) => m.name);
      }

      res.json({ models: modelNames });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  }
}

export const aiModelController = new AIModelController();
