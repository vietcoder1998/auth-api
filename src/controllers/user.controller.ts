import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { generateToken, generateRefreshToken } from '../service/auth.service';
import { client } from '../setup';
import { setPaginationMeta } from '../middlewares/response.middleware';

const prisma = new PrismaClient();

// Helper: cache token in Redis (same as auth.controller.ts)
async function cacheToken(token: string, userId: string, expiresIn: number) {
  await client.set(`token:${token}`, userId, { EX: expiresIn });
}

export async function getUsers(req: Request, res: Response) {  
  try {
    // Extract query parameters
    const {
      page = '1',
      limit = '10',
      pageSize = limit,
      search = '',
      q = search,
      status,
      roleId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Parse pagination parameters
    const currentPage = Math.max(1, parseInt(page as string, 10));
    const currentLimit = Math.max(1, Math.min(100, parseInt(pageSize as string, 10)));
    const skip = (currentPage - 1) * currentLimit;

    // Build where clause for search and filters
    const whereClause: any = {};

    // Search across multiple fields
    if (q && typeof q === 'string' && q.trim()) {
      const searchTerm = q.trim();
      whereClause.OR = [
        { email: { contains: searchTerm } },
        { nickname: { contains: searchTerm } }
      ];
    }

    // Status filter
    if (status && typeof status === 'string') {
      whereClause.status = status;
    }

    // Role filter
    if (roleId && typeof roleId === 'string') {
      whereClause.roleId = roleId;
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'email') {
      orderBy.email = sortOrder;
    } else if (sortBy === 'nickname') {
      orderBy.nickname = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else {
      orderBy.createdAt = 'desc'; // Default
    }

    // Get total count for pagination
    const total = await prisma.user.count({ where: whereClause });

    // Get users with pagination
    const users = await prisma.user.findMany({
      where: whereClause,
      select: { 
        id: true, 
        email: true, 
        nickname: true, 
        roleId: true, 
        status: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy,
      skip,
      take: currentLimit
    });

    // Set pagination metadata for response middleware
    setPaginationMeta(req, total, currentPage, currentLimit);

    // Return paginated response
    res.json({
      data: users,
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit)
    });
    
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

export async function createUser(req: Request, res: Response) {
  const { email, password, nickname, roleId, status } = req.body;
  try {
    const user = await prisma.user.create({
      data: { email, password, nickname, roleId, status }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const { email, nickname, roleId, status } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { email, nickname, roleId, status }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
}

export async function searchUsers(req: Request, res: Response) {
  const { q } = req.query;
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: String(q) } },
          { nickname: { contains: String(q) } }
        ]
      }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search users' });
  }
}

export async function handoverUserStatus(req: Request, res: Response) {
  const { userId, newStatus } = req.body;
  const requesterId = req.headers['x-user-id'] as string;
  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
    include: { role: true },
  });
  if (!requester || requester.role?.name !== 'superadmin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const user = await prisma.user.update({ where: { id: userId }, data: { status: newStatus } });
  res.json({ user });
}

export async function loginAsUser(req: Request, res: Response) {
  try {
    const { email } = req.body;
    const requesterId = req.headers['x-user-id'] as string;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!requesterId) {
      return res.status(401).json({ 
        error: 'Unauthorized: No user ID found in request headers',
        details: 'Authentication required. Please ensure you are logged in as an admin.'
      });
    }

    // Verify that the requester is an admin
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      include: { role: { include: { permissions: true } } },
    });

    if (!requester) {
      return res.status(401).json({ error: 'Unauthorized: Invalid requester' });
    }

    // Check if requester has admin permissions (superadmin or admin role, or manage_users permission)
    const hasAdminAccess = 
      requester.role?.name === 'superadmin' || 
      requester.role?.name === 'admin' ||
      requester.role?.permissions?.some(p => p.name === 'manage_users');

    if (!hasAdminAccess) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // Find the target user
    const targetUser = await prisma.user.findUnique({
      where: { email },
      include: { role: { include: { permissions: true } } },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.status !== 'active') {
      return res.status(400).json({ error: 'Cannot login as inactive user' });
    }

    // Generate JWT tokens using the same pattern as regular login
    const accessToken = generateToken({
      userId: targetUser.id,
      email: targetUser.email,
      ...(targetUser.roleId ? { role: targetUser.roleId } : {})
    }, '1h');

    const refreshToken = generateRefreshToken({ userId: targetUser.id }, '7d');

    // Save tokens in DB (same pattern as regular login)
    const tokenRecord = await prisma.token.create({
      data: {
        userId: targetUser.id,
        accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour (same as regular login)
      },
    });

    // Cache access token in Redis (same as regular login)
    await cacheToken(accessToken, targetUser.id, 3600);

    // Log the impersonation action (for audit trail)
    console.log(`Admin impersonation: ${requester.email} (${requester.id}) logged in as ${targetUser.email} (${targetUser.id}) at ${new Date().toISOString()}`);

    // Return success response in same format as regular login
    res.json({
      accessToken,
      refreshToken,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        nickname: targetUser.nickname,
        role: targetUser.role?.name,
        status: targetUser.status
      },
      impersonation: {
        adminId: requester.id,
        adminEmail: requester.email,
        impersonatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in loginAsUser:', error);
    res.status(500).json({ 
      error: 'Failed to login as user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { email } = req.params;
    const requesterId = req.headers['x-user-id'] as string;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!requesterId) {
      return res.status(401).json({ 
        error: 'Unauthorized: No user ID found in request headers',
        details: 'Authentication required. Please ensure you are logged in as an admin.'
      });
    }

    // Verify that the requester is an admin
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      include: { role: { include: { permissions: true } } },
    });

    if (!requester) {
      return res.status(401).json({ error: 'Unauthorized: Invalid requester' });
    }

    // Check if requester has admin permissions
    const hasAdminAccess = 
      requester.role?.name === 'superadmin' || 
      requester.role?.name === 'admin' ||
      requester.role?.permissions?.some(p => p.name === 'delete_user' || p.name === 'manage_users');

    if (!hasAdminAccess) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // Prevent self-deletion
    if (requester.email === email) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Find the target user
    const targetUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete all user tokens first (due to foreign key constraint)
    await prisma.token.deleteMany({
      where: { userId: targetUser.id }
    });

    // Delete the user
    await prisma.user.delete({
      where: { email }
    });

    // Log the deletion action
    console.log(`User deletion: ${requester.email} (${requester.id}) deleted user ${email} (${targetUser.id}) at ${new Date().toISOString()}`);

    res.json({
      message: `User ${email} deleted successfully`,
      data: {
        deletedUser: {
          id: targetUser.id,
          email: targetUser.email,
          nickname: targetUser.nickname,
        },
        deletedBy: {
          id: requester.id,
          email: requester.email,
          nickname: requester.nickname,
        }
      }
    });

  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({ 
      error: 'Failed to delete user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
