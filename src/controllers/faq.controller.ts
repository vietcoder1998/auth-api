
import { Request, Response } from 'express';
import { faqService } from '../services/faq.service';

export async function listFaqs(req: Request, res: Response) {
  try {
    const faqs = await faqService.listFaqs(req.query.q as string);
    res.json({ success: true, data: faqs });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}

export async function getFaq(req: Request, res: Response) {
  try {
    const faq = await faqService.getFaq(req.params.id);
    if (!faq) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: faq });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}

export async function createFaq(req: Request, res: Response) {
  try {
    const faq = await faqService.createFaq(req.body);
    res.status(201).json({ success: true, data: faq });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}

export async function updateFaq(req: Request, res: Response) {
  try {
    const faq = await faqService.updateFaq(req.params.id, req.body);
    res.json({ success: true, data: faq });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}

export async function deleteFaq(req: Request, res: Response) {
  try {
    await faqService.deleteFaq(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}
