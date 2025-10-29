import { 
  entityRepository,
  entityMethodRepository,
  UserRepository,
  roleRepository,
  permissionRepository
} from '../repositories';

/**
 * Unified Database Service
 * Provides repository access
 */
export class DatabaseService {
  private static instance: DatabaseService;
  
  private constructor() {}
  
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Repository access
   */
  public get repository() {
    return {
      entity: entityRepository,
      entityMethod: entityMethodRepository,
      user: new UserRepository(),
      role: roleRepository,
      permission: permissionRepository,
    };
  }
}

// Export singleton instance
export const dbService = DatabaseService.getInstance();

// Export for backward compatibility  
export default dbService;