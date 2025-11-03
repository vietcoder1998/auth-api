import { Request, Response } from 'express';
import * as aiPlatformService from '../services/aiPlatform.service';

export const createAIPlatform = async (request: Request, response: Response) => {
  try {
    const platform = await aiPlatformService.createAIPlatform(request.body);
    response.status(201).json(platform);
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
};

export const getAIPlatforms = async (_: Request, response: Response) => {
  try {
    const { query } = _.params;
    const platforms = await aiPlatformService.getAIPlatforms(query);
    response.json(platforms);
  } catch (error) {
    response.status(500).json({ error: (error as Error).message });
  }
};

export const getAIPlatformById = async (request: Request, response: Response) => {
  try {
    const platform = await aiPlatformService.getAIPlatformById(request.params.id);
    if (!platform) return response.status(404).json({ error: 'Not found' });
    response.json(platform);
  } catch (error) {
    response.status(500).json({ error: (error as Error).message });
  }
};

export const updateAIPlatform = async (request: Request, response: Response) => {
  try {
    const platform = await aiPlatformService.updateAIPlatform(request.params.id, request.body);
    response.json(platform);
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
};

export const deleteAIPlatform = async (request: Request, response: Response) => {
  try {
    await aiPlatformService.deleteAIPlatform(request.params.id);
    response.status(204).end();
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
};
