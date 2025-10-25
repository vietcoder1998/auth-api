import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// List all tools (optionally by agent)
export async function listTools(req: Request, res: Response) {
  try {
    const { agentId } = req.query;
    const tools = await prisma.tool.findMany({
      where: agentId ? { agentId: String(agentId) } : {},
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: tools });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}

// Get tool by id
export async function getTool(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const tool = await prisma.tool.findUnique({ where: { id } });
    if (!tool) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: tool });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}

// Create tool
export async function createTool(req: Request, res: Response) {
  try {
    const tool = await prisma.tool.create({ data: req.body });
    res.status(201).json({ success: true, data: tool });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}

// Update tool
export async function updateTool(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const tool = await prisma.tool.update({ where: { id }, data: req.body });
    res.json({ success: true, data: tool });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}

// Delete tool
export async function deleteTool(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.tool.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}
