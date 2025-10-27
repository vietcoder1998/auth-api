import { PrismaClient } from '@prisma/client';
import { LoginHistoryRepository, LogicHistoryRepository } from '../../src/repositories';

/**
 * History Seeder
 * Handles seeding of login history and logic history
 */

export class HistorySeeder {
  private loginHistoryRepo: LoginHistoryRepository;
  private logicHistoryRepo: LogicHistoryRepository;
  private userMapping: Record<string, any>;
  private agentMapping: Record<string, any[]>;

  constructor(
    prisma: PrismaClient,
    userMapping: Record<string, any>,
    agentMapping: Record<string, any[]>
  ) {
    this.loginHistoryRepo = new LoginHistoryRepository(prisma.loginHistory);
    this.logicHistoryRepo = new LogicHistoryRepository(prisma.logicHistory);
    this.userMapping = userMapping;
    this.agentMapping = agentMapping;
  }

  /**
   * Seed all history-related data
   */
  async seed(): Promise<void> {
    console.log('📜 Seeding history...');
    await this.seedLoginHistory();
    await this.seedLogicHistory();
  }

  /**
   * Create login history entries for users
   * Uses batch operations for performance
   */
  private async seedLoginHistory(): Promise<void> {
    const { mockLoginHistory } = await import('../mock/history.mock');
    
    const userEmails = Object.keys(this.userMapping);
    if (userEmails.length === 0) {
      console.log('  ⚠️  No users found, skipping login history');
      return;
    }

    // Create login history entries for each user
    const historyData: any[] = [];
    
    for (const email of userEmails) {
      const user = this.userMapping[email];
      
      // Add all mock login history entries for this user
      for (const entry of mockLoginHistory) {
        historyData.push({
          ...entry,
          userId: user.id,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        });
      }
    }

    // Batch create for performance
    if (historyData.length > 0) {
      // Check for duplicates in parallel
      const uniqueEntries = await this.filterDuplicateLoginHistory(historyData);
      
      if (uniqueEntries.length > 0) {
        await this.loginHistoryRepo.createMany(uniqueEntries);
        console.log(`  ✓ Created ${uniqueEntries.length} login history entries`);
      } else {
        console.log(`  ⚠️  All login history entries already exist`);
      }
    }
  }

  /**
   * Filter out duplicate login history entries
   */
  private async filterDuplicateLoginHistory(entries: any[]): Promise<any[]> {
    const checkPromises = entries.map(entry =>
      this.loginHistoryRepo.search({
        where: {
          userId: entry.userId,
          action: entry.action,
          ipAddress: entry.ipAddress,
          createdAt: entry.createdAt,
        },
        take: 1,
      })
    );

    const existingEntries = await Promise.all(checkPromises);
    return entries.filter((_, index) => !existingEntries[index] || existingEntries[index].length === 0);
  }

  /**
   * Create logic history entries
   * Uses batch operations for performance
   */
  private async seedLogicHistory(): Promise<void> {
    const { mockLogicHistory } = await import('../mock/history.mock');
    
    const userEmails = Object.keys(this.userMapping);
    if (userEmails.length === 0) {
      console.log('  ⚠️  No users found, skipping logic history');
      return;
    }

    // Create logic history entries for each user and their agents
    const historyData: any[] = [];
    
    for (const email of userEmails) {
      const user = this.userMapping[email];
      const userAgents = this.agentMapping[user.id] || [];
      
      // Add logic history for user actions
      for (const entry of mockLogicHistory) {
        historyData.push({
          ...entry,
          userId: user.id,
          agentId: userAgents.length > 0 ? userAgents[0].id : null,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        });
      }
    }

    // Batch create for performance
    if (historyData.length > 0) {
      // Check for duplicates in parallel
      const uniqueEntries = await this.filterDuplicateLogicHistory(historyData);
      
      if (uniqueEntries.length > 0) {
        await this.logicHistoryRepo.createMany(uniqueEntries);
        console.log(`  ✓ Created ${uniqueEntries.length} logic history entries`);
      } else {
        console.log(`  ⚠️  All logic history entries already exist`);
      }
    }
  }

  /**
   * Filter out duplicate logic history entries
   */
  private async filterDuplicateLogicHistory(entries: any[]): Promise<any[]> {
    const checkPromises = entries.map(entry =>
      this.logicHistoryRepo.search({
        where: {
          userId: entry.userId,
          action: entry.action,
          createdAt: entry.createdAt,
        },
        take: 1,
      })
    );

    const existingEntries = await Promise.all(checkPromises);
    return entries.filter((_, index) => !existingEntries[index] || existingEntries[index].length === 0);
  }
}
