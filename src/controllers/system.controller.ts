import { Request, Response } from 'express';
import { forceRestartNode } from '../services/system.service';

export const restartBackend = async (req: Request, res: Response) => {
  try {
    const result = await forceRestartNode();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to restart server.' });
  }
};
