import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { BaseService } from './base.service';
import { UserRepository } from '../repositories/user.repository';
import { AgentRepository } from '../repositories/agent.repository';
import { ConversationRepository } from '../repositories/conversation.repository';
import { UserDto } from '../interfaces';

const prisma = new PrismaClient();

export interface CreateUserData {
  email: string;
  password: string;
  nickname?: string;
  roleId?: string;
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  nickname?: string;
  roleId?: string;
  status?: string;
}

export class UserService extends BaseService<any, UserDto, UserDto> {
  private userRepository: UserRepository;
  private agentRepository: AgentRepository;
  private conversationRepository: ConversationRepository;

  constructor() {
    const userRepository = new UserRepository();
    super(userRepository);
    this.userRepository = userRepository;
    this.agentRepository = new AgentRepository();
    this.conversationRepository = new ConversationRepository();
  }  /**
   * Create a new user
   */
  async createUser(data: CreateUserData) {
    const { email, password, nickname, roleId } = data;

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.userRepository.createWithRole({
      email,
      password: hashedPassword,
      nickname,
      roleId,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  /**
   * Get user by ID
   */
  async getUserById(id: string) {
    const user = await this.userRepository.findWithRole(id);

    if (!user) {
      throw new Error('User not found');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
    return await this.userRepository.findByEmail(email);
  }
  /**
   * Update user
   */
  async updateUser(id: string, data: UpdateUserData) {
    const updateData: any = { ...data };

    // Hash password if provided
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    const user = await this.userRepository.updateWithRole(id, updateData);

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  /**
   * Delete user
   */
  async deleteUser(id: string) {
    return await this.repository.delete(id);
  }
  /**
   * Get all users with pagination
   */
  async getUsers(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [{ email: { contains: search } }, { nickname: { contains: search } }],
        }
      : {};

    const [users, total] = await Promise.all([
      this.userRepository.search({
        where,
        skip,
        take: limit,
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    // Remove passwords from response
    const usersWithoutPasswords = users.map(({ password, ...user }: any) => user);

    return {
      data: usersWithoutPasswords,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  /**
   * Verify user password
   */
  async verifyPassword(id: string, password: string) {
    const user: any = await this.repository.findById(id);

    if (!user) {
      throw new Error('User not found');
    }

    return await bcrypt.compare(password, user.password);
  }
  /**
   * Change user password
   */
  async changePassword(id: string, oldPassword: string, newPassword: string) {
    const user: any = await this.repository.findById(id);

    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid old password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    return await this.repository.update(id, { password: hashedPassword });
  }
  /**
   * Get user's agents
   */
  async getUserAgents(userId: string) {
    return await this.agentRepository.search({
      where: { userId },
      include: {
        _count: {
          select: {
            conversations: true,
            memories: true,
            tools: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  /**
   * Get user's conversations
   */
  async getUserConversations(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      this.conversationRepository.search({
        where: { userId },
        skip,
        take: limit,
        include: {
          agent: {
            select: { id: true, name: true, model: true },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.conversation.count({ where: { userId } }),
    ]);

    return {
      data: conversations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const userService = new UserService();
