/// <reference types="node" />
/**
 * Database Seeder Entry Point
 * 
 * This is the main entry point for database seeding operations.
 * It uses the modular DatabaseSeeder class for better organization.
 * 
 * @see seeders/database.seeder.ts
 * @see docs/SEEDER_REFACTORING_GUIDE.md
 */

import { PrismaClient } from '@prisma/client';
import { DatabaseSeeder } from './seeders/database.seeder';

const prisma = new PrismaClient();

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   Database Seeding - Modular System     ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const startTime = Date.now();
  
  try {
    const seeder = new DatabaseSeeder(prisma);
    await seeder.seed();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️  Total seeding time: ${duration}s`);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('\n👋 Seeder process completed');
  });
