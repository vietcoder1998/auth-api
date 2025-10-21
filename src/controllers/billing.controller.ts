import { Request, Response } from 'express';
import * as billingService from '../services/billing.service';

export const createBilling = async (req: Request, res: Response) => {
  try {
    const billing = await billingService.createBilling(req.body);
    res.status(201).json(billing);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getBillings = async (_: Request, res: Response) => {
  try {
    const billings = await billingService.getBillings();
    res.json(billings);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getBillingById = async (req: Request, res: Response) => {
  try {
    const billing = await billingService.getBillingById(req.params.id);
    if (!billing) return res.status(404).json({ error: 'Not found' });
    res.json(billing);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateBilling = async (req: Request, res: Response) => {
  try {
    const billing = await billingService.updateBilling(req.params.id, req.body);
    res.json(billing);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteBilling = async (req: Request, res: Response) => {
  try {
    await billingService.deleteBilling(req.params.id);
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};
