import bcrypt from 'bcryptjs';
import {
  CreateUserData,
  TokenDto,
  UpdateUserData,
  UserDro,
  UserDto,
  UserModel,
  UserWithoutTokenDto,
} from '../interfaces';
import {
  AgentRepository,
  ConversationRepository,
  TokenRepository,
  UserRepository,
  userRepository,
} from '../repositories';
import { BaseService } from './index';

export class UserService extends BaseService<UserModel, UserDto, UserDro> {
  private userRepository: UserRepository;
  private agentRepository: AgentRepository;
  private conversationRepository: ConversationRepository;
  private tokenRepository: TokenRepository;

  constructor(repo = userRepository) {
    super(repo);
    this.userRepository = repo;
    this.agentRepository = new AgentRepository();
    this.conversationRepository = new ConversationRepository();
    this.tokenRepository = new TokenRepository();
  } /**
   * Create a new user
   */
  public async createUser(data: CreateUserData) {
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
  public async getUserById(id: string) {
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
  public async getUserByEmail(email: string) {
    return await this.userRepository.findByEmail(email);
  }
  /**
   * Update user
   */
  public async updateUser(id: string, data: UpdateUserData) {
    const updateData: any = { ...data };

    // Hash password if provided
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    const user = await this.userRepository.update(id, updateData);

    return user;
  }
  /**
   * Delete user
   */
  public async deleteUser(id: string) {
    return await this.repository.delete(id);
  }
  /**
   * Get all users with pagination
   */
  public async getUsers(page: number = 1, limit: number = 20, search?: string) {
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
      this.userRepository.count({ where }),
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
  public async verifyPassword(id: string, password: string) {
    const user: any = await this.repository.findById(id);

    if (!user) {
      throw new Error('User not found');
    }

    return await bcrypt.compare(password, user.password);
  }
  /**
   * Change user password
   */
  public async changePassword(id: string, oldPassword: string, newPassword: string) {
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
  public async getUserAgents(userId: string) {
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
  public async getUserConversations(userId: string, page: number = 1, limit: number = 20) {
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
      this.conversationRepository.count({ where: { userId } }),
    ]);

    return {
      data: conversations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Count users by criteria
   */
  public async count(where: any): Promise<number> {
    return this.userRepository.count({ where });
  }

  /**
   * Save a token for a user (for compatibility; should use tokenService in future)
   */
  public async saveToken(data: TokenDto): Promise<any> {
    // Save token using tokenRepository
    return this.tokenRepository.create({ data });
  }

  /**
   * Delete all tokens for a user by userId (for compatibility; should use tokenService in future)
   */
  public async deleteTokensByUserId(userId: string): Promise<any> {
    return this.tokenRepository.deleteMany({ where: { userId } });
  }

  /**
   * Delete a user by email
   */
  public async deleteByEmail(email: string): Promise<any> {
    return this.userRepository.deleteMany({ where: { email } });
  }

  /**
   * Create user (controller compatibility)
   */
  public async create(data: any): Promise<UserDto> {
    // Accepts plain object, hashes password if present
    const userData = { ...data };
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 12);
    }
    const user = await this.userRepository.createWithRole(userData);
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as UserDto;
  }

  /**
   * Update user (controller compatibility)
   */
  public override async update(
    id: string,
    data: UpdateUserData,
  ): Promise<UserWithoutTokenDto | null> {
    const updateData = { ...data };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    const userWithoutPassword: UserWithoutTokenDto | null = await this.userRepository.update(
      id,
      updateData,
    );

    return userWithoutPassword;
  }

  public async findFirst(args: any): Promise<UserDto | null> {
    return this.userRepository.findFirst(args);
  }

  public async findUnique(args: any): Promise<UserDto | null> {
    return this.userRepository.findUnique({
      ...args,
    });
  }
}

export const userService = new UserService();
