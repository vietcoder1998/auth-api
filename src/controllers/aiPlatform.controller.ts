import { Request, Response } from 'express';
import * as aiPlatformService from '../services/aiPlatform.service';

export const createAIPlatform = async (req: Request, res: Response) => {
  try {
    const platform = await aiPlatformService.createAIPlatform(req.body);
    res.status(201).json(platform);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAIPlatforms = async (_: Request, res: Response) => {
  try {
    const platforms = await aiPlatformService.getAIPlatforms();
    res.json(platforms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAIPlatformById = async (req: Request, res: Response) => {
  try {
    const platform = await aiPlatformService.getAIPlatformById(req.params.id);
    if (!platform) return res.status(404).json({ error: 'Not found' });
    res.json(platform);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAIPlatform = async (req: Request, res: Response) => {
  try {
    const platform = await aiPlatformService.updateAIPlatform(req.params.id, req.body);
    res.json(platform);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteAIPlatform = async (req: Request, res: Response) => {
  try {
    await aiPlatformService.deleteAIPlatform(req.params.id);
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
