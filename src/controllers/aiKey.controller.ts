import { Request, Response } from 'express';
import * as aiKeyService from '../services/aiKey.service';

export const createAIKey = async (req: Request, res: Response) => {
  try {
    const key = await aiKeyService.createAIKey(req.body);
    res.status(201).json(key);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getAIKeys = async (_: Request, res: Response) => {
  try {
    const keys = await aiKeyService.getAIKeys();
    res.json(keys);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getAIKeyById = async (req: Request, res: Response) => {
  try {
    const key = await aiKeyService.getAIKeyById(req.params.id);
    if (!key) return res.status(404).json({ error: 'Not found' });
    res.json(key);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateAIKey = async (req: Request, res: Response) => {
  try {
    const key = await aiKeyService.updateAIKey(req.params.id, req.body);
    res.json(key);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteAIKey = async (req: Request, res: Response) => {
  try {
    await aiKeyService.deleteAIKey(req.params.id);
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};
