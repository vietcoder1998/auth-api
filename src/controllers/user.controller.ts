import { Request, Response } from 'express';
import { CacheMiddleware, cacheMiddleware, ResponseMiddleware } from '../middlewares';
import { authService, UserService, userService } from '../services';
import { TokenDto,  UserDro, UserDto, UserModel } from '../interfaces';
import { BaseController } from './index';


/**
 * UserController - HTTP request handlers for User operations
 * Extends BaseController to inherit common CRUD operations
 */
class UserController extends BaseController<UserModel, UserDto, UserDro> {
  private cacheMiddleware: CacheMiddleware = cacheMiddleware;
  private userService: UserService = userService;
  constructor() {
    super(userService);
  }

  public async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        limit = '10',
        pageSize = limit,
        search = '',
        q = search,
        status,
        roleId,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;
      const currentPage = Math.max(1, parseInt(page as string, 10));
      const currentLimit = Math.max(1, Math.min(100, parseInt(pageSize as string, 10)));
      const skip = (currentPage - 1) * currentLimit;
      const whereClause: any = {};
      if (q && typeof q === 'string' && q.trim()) {
        const searchTerm = q.trim();
        whereClause.OR = [
          { email: { contains: searchTerm } },
          { nickname: { contains: searchTerm } },
        ];
      }
      if (status && typeof status === 'string') {
        whereClause.status = status;
      }
      if (roleId && typeof roleId === 'string') {
        whereClause.roleId = roleId;
      }
      const orderBy: any = {};
      if (sortBy === 'email') {
        orderBy.email = sortOrder;
      } else if (sortBy === 'nickname') {
        orderBy.nickname = sortOrder;
      } else if (sortBy === 'createdAt') {
        orderBy.createdAt = sortOrder;
      } else {
        orderBy.createdAt = 'desc';
      }
      const total = await this.userService.count(whereClause);
      const users = await this.userService.findMany({
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
              name: true,
            },
          },
        },
        orderBy,
        skip,
        take: currentLimit,
      });
      ResponseMiddleware.setPaginationMeta(req, total, currentPage, currentLimit);
      res.json({
        data: users,
        total,
        page: currentPage,
        limit: currentLimit,
        totalPages: Math.ceil(total / currentLimit),
      });
    } catch (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  public async createUser(req: Request, res: Response): Promise<void> {
    const { email, password, nickname, roleId, status } = req.body;
    try {
      const user = await this.userService.create({ email, password, nickname, roleId, status });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  public async updateUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { email, nickname, roleId, status } = req.body;
    try {
      const user = await this.userService.update(id, { email, nickname, roleId, status });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  public async searchUsers(req: Request, res: Response): Promise<void> {
    const { q } = req.query;
    try {
      const users = await this.userService.findMany({
        where: {
          OR: [
            { email: { contains: String(q) } },
            { nickname: { contains: String(q) } },
          ],
        },
      });
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: 'Failed to search users' });
    }
  }

  public async handoverUserStatus(req: Request, res: Response): Promise<void> {
    const { userId, newStatus } = req.body;
    const requesterId = req.headers['x-user-id'] as string;
    const requester = await this.userService.findFirst({
      where: { id: requesterId },
      include: { role: true },
    });
    if (!requester || requester.role?.name !== 'superadmin') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const user = await this.userService.update(userId, { status: newStatus });
    res.json({ user });
  }

  public async loginAsUser(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const requesterId = req.headers['x-user-id'] as string;
      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }
      if (!requesterId) {
        res.status(401).json({
          error: 'Unauthorized: No user ID found in request headers',
          details: 'Authentication required. Please ensure you are logged in as an admin.',
        });
        return;
      }
      const requester = await this.userService.findUnique({
        where: { id: requesterId },
        include: { role: { include: { permissions: true } } },
      });
      if (!requester) {
        res.status(401).json({ error: 'Unauthorized: Invalid requester' });
        return;
      }
      const hasAdminAccess =
        requester.role?.name === 'superadmin' ||
        requester.role?.name === 'admin' ||
        requester.role?.permissions?.some((p: any) => p.name === 'manage_users');
      if (!hasAdminAccess) {
        res.status(403).json({ error: 'Forbidden: Admin access required' });
        return;
      }
      const targetUser = await this.userService.findUnique({
        where: { email },
        include: { role: { include: { permissions: true } } },
      });
      if (!targetUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      if (targetUser.status !== 'active') {
        res.status(400).json({ error: 'Cannot login as inactive user' });
        return;
      }
      const accessToken = authService.generateToken(
        {
          userId: targetUser.id,
          email: targetUser.email,
          ...(targetUser.roleId ? { role: targetUser.roleId } : {}),
        },
        '1h',
      );
      const refreshToken = authService.generateRefreshToken({ userId: targetUser.id }, '7d');
      // Save tokens in DB (same pattern as regular login)
      // You may want to use a tokenService here if available
      await this.userService.saveToken({
        userId: targetUser.id,
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiresAt: new Date(Date.now() + 3600 * 1000),
        // Add any other required TokenDto fields here if needed
      } as TokenDto);
      await this.cacheMiddleware.cacheToken(accessToken, targetUser.id, 3600);
      console.log(
        `Admin impersonation: ${requester.email} (${requester.id}) logged in as ${targetUser.email} (${targetUser.id}) at ${new Date().toISOString()}`,
      );
      res.json({
        accessToken,
        refreshToken,
        user: {
          id: targetUser.id,
          email: targetUser.email,
          nickname: targetUser.nickname,
          role: targetUser.role?.name,
          status: targetUser.status,
        },
        impersonation: {
          adminId: requester.id,
          adminEmail: requester.email,
          impersonatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error in loginAsUser:', error);
      res.status(500).json({
        error: 'Failed to login as user',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  public async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.params;
      const requesterId = req.headers['x-user-id'] as string;
      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }
      if (!requesterId) {
        res.status(401).json({
          error: 'Unauthorized: No user ID found in request headers',
          details: 'Authentication required. Please ensure you are logged in as an admin.',
        });
        return;
      }
      const requester = await this.userService.findUnique({
        where: { id: requesterId },
        include: { role: { include: { permissions: true } } },
      });
      if (!requester) {
        res.status(401).json({ error: 'Unauthorized: Invalid requester' });
        return;
      }
      const hasAdminAccess =
        requester.role?.name === 'superadmin' ||
        requester.role?.name === 'admin' ||
        requester.role?.permissions?.some(
          (p: any) => p.name === 'delete_user' || p.name === 'manage_users',
        );
      if (!hasAdminAccess) {
        res.status(403).json({ error: 'Forbidden: Admin access required' });
        return;
      }
      if (requester.email === email) {
        res.status(400).json({ error: 'Cannot delete your own account' });
        return;
      }
      const targetUser = await this.userService.findUnique({
        where: { email },
      });
      if (!targetUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      // Delete all user tokens first (due to foreign key constraint)
      await this.userService.deleteTokensByUserId(targetUser.id);
      await this.userService.deleteByEmail(email);
      console.log(
        `User deletion: ${requester.email} (${requester.id}) deleted user ${email} (${targetUser.id}) at ${new Date().toISOString()}`,
      );
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
          },
        },
      });
    } catch (error) {
      console.error('Error in deleteUser:', error);
      res.status(500).json({
        error: 'Failed to delete user',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const userController = new UserController();

