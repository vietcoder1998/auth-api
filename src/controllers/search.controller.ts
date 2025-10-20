import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
const prisma = new PrismaClient();

interface SearchResultBase {
  type: string;
  name: string;
  description: string;
  id: number | string;
}

interface UserResult extends SearchResultBase {
  type: 'user';
  name: string;
  description: string;
  id: number | string;
}

interface RoleResult extends SearchResultBase {
  type: 'role';
}

interface PermissionResult extends SearchResultBase {
  type: 'permission';
}

interface AgentResult extends SearchResultBase {
  type: 'agent';
}

interface ConversationResult extends SearchResultBase {
  type: 'conversation';
}

interface MailTemplateResult extends SearchResultBase {
  type: 'mailTemplate';
}

interface NotificationTemplateResult extends SearchResultBase {
  type: 'notificationTemplate';
}

interface ApiKeyResult extends SearchResultBase {
  type: 'apiKey';
}

interface DatabaseConnectionResult extends SearchResultBase {
  type: 'databaseConnection';
}
// Utility: search in multiple tables/entities
export async function searchAllEntities(req: Request, res: Response) {
  const { q } = req.query;
  if (!q || typeof q !== 'string' || q.length < 2) {
    return res.status(400).json({ error: 'Query too short' });
  }
  const query = q.trim();
  try {
    // Search users
    const users = await prisma.user.findMany({
      where: {
        OR: [{ email: { contains: query } }, { nickname: { contains: query } }],
      },
      select: { id: true, email: true, nickname: true, role: true },
      take: 10,
    });
    // Search roles
    const roles = await prisma.role.findMany({
      where: { name: { contains: query } },
      select: { id: true, name: true, description: true },
      take: 10,
    });
    // Search permissions
    const permissions = await prisma.permission.findMany({
      where: { name: { contains: query } },
      select: { id: true, name: true, description: true },
      take: 10,
    });
    // Search agents
    const agents = await prisma.agent.findMany({
      where: { name: { contains: query } },
      select: { id: true, name: true, description: true },
      take: 10,
    });
    // Search conversations
    const conversations = await prisma.conversation.findMany({
      where: { title: { contains: query } },
      select: { id: true, title: true, summary: true },
      take: 10,
    });
    // Search mail templates
    const mailTemplates = await prisma.mailTemplate.findMany({
      where: { name: { contains: query } },
      select: { id: true, name: true, subject: true },
      take: 10,
    });
    // Search notification templates
    const notificationTemplates = await prisma.notificationTemplate.findMany({
      where: { name: { contains: query } },
      select: { id: true, name: true, title: true },
      take: 10,
    });
    // Search API keys
    const apiKeys = await prisma.apiKey.findMany({
      where: { name: { contains: query } },
      select: { id: true, name: true, description: true },
      take: 10,
    });
    // Search database connections
    const dbConnections = await prisma.databaseConnection.findMany({
      where: { name: { contains: query } },
      select: { id: true, name: true, description: true },
      take: 10,
    });
    // Merge and tag results

    type SearchResult =
      | UserResult
      | RoleResult
      | PermissionResult
      | AgentResult
      | ConversationResult
      | MailTemplateResult
      | NotificationTemplateResult
      | ApiKeyResult
      | DatabaseConnectionResult;

    const results: SearchResult[] = [
      ...users.map(
        (u): UserResult => ({
          type: 'user',
          name: u.nickname || u.email || '',
          description: u.email || '',
          id: u.id,
        }),
      ),
      ...roles.map(
        (r): RoleResult => ({
          type: 'role',
          name: r.name || '',
          description: r.description ?? '',
          id: r.id,
        }),
      ),
      ...permissions.map(
        (p): PermissionResult => ({
          type: 'permission',
          name: p.name || '',
          description: p.description ?? '',
          id: p.id,
        }),
      ),
      ...agents.map(
        (a): AgentResult => ({
          type: 'agent',
          name: a.name || '',
          description: a.description ?? '',
          id: a.id,
        }),
      ),
      ...conversations.map(
        (c): ConversationResult => ({
          type: 'conversation',
          name: c.title || '',
          description: c.summary ?? '',
          id: c.id,
        }),
      ),
      ...mailTemplates.map(
        (m): MailTemplateResult => ({
          type: 'mailTemplate',
          name: m.name || '',
          description: m.subject ?? '',
          id: m.id,
        }),
      ),
      ...notificationTemplates.map(
        (n): NotificationTemplateResult => ({
          type: 'notificationTemplate',
          name: n.name || '',
          description: n.title ?? '',
          id: n.id,
        }),
      ),
      ...apiKeys.map(
        (a): ApiKeyResult => ({
          type: 'apiKey',
          name: a.name || '',
          description: a.description ?? '',
          id: a.id,
        }),
      ),
      ...dbConnections.map(
        (d): DatabaseConnectionResult => ({
          type: 'databaseConnection',
          name: d.name || '',
          description: d.description ?? '',
          id: d.id,
        }),
      ),
    ];
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: 'Search failed', details: error });
  }
}
